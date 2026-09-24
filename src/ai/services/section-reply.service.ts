import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SectionId } from '../../common/types/contract.js';
import { LLM_PROVIDER, type LlmMessage, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildConversationPrompt, buildExtractionPrompt } from '../prompts/section-reply.prompt.js';
import { CARD_SCHEMA_BY_SECTION, conversationReplySchema, type SectionReply } from '../schemas/section-reply.schema.js';

/**
 * A technical failure talking to the model is never something the user caused, and they must
 * never see it spelled out — no error bubble, no "الرد مش بالشكل المتوقع". When every retry is
 * exhausted, the assistant just asks to hear it again, in its own voice, like a person who didn't
 * quite catch that.
 */
const SOFT_FALLBACK_MESSAGE = 'معلش، ممكن تقولهالي تاني؟';

/**
 * Used when extraction still can't produce a card after the hard cap has already fired — the
 * section clearly has real data (it's had many turns), but it can't be turned into something valid.
 * Progress must not depend on extraction succeeding: the user is told plainly, in the assistant's
 * voice, that this one will be revisited, and the conversation moves on rather than repeating the
 * same failed attempt forever.
 */
const SKIP_INCOMPLETE_MESSAGE = 'معلش، الموضوع ده طلع صعب شوية دلوقتي — هرجعله تاني بعدين، خلينا نكمل الباقي.';

const JSON_ONLY_REMINDER = 'رد بكائن JSON بس، من غير أي نص قبله أو بعده.';

/** Reminders sent on each retry of the conversation call, escalating from a pure formatting nudge to also asking for different phrasing. */
const CONVERSATION_RETRY_REMINDERS = [JSON_ONLY_REMINDER, 'حاول تاني بصياغة سؤال مختلفة، ورد بكائن JSON بس زي ما اتطلب من غير أي نص تاني.'];

const EMPTY_ARRAY_REMINDER =
  'راجع المحادثة تاني بالكامل، من أول رسالة للآخر — هل ذكر المستخدم أي عنصر فعلي في أي رسالة من رسايله في أي وقت؟ لو أيوه، لازم يتحط في الـ array حتى لو آخر رسالة بتاعته بتقول "مفيش" أو "خلاص". رجع array فاضي [] بس لو مفيش أي عنصر اتقال فعلاً من الأول للآخر.';

/**
 * Recognizing "I'm done" is treated as a deterministic, code-level decision, not something left
 * to the model to get right on every turn — a small model closing a section is exactly the kind
 * of behavior that shouldn't depend on it correctly interpreting Egyptian colloquial phrasing
 * every single time. Matches only short messages: a longer, substantive answer that happens to
 * contain "مفيش" (e.g. describing a job) is real content, not a closing utterance.
 */
const CLOSING_INTENT = /خلاص|مفيش|بس كده|كده بس|كفاية|خلصنا|خلصت/;
const MAX_MESSAGE_LENGTH_FOR_CLOSING_INTENT = 40;

function hasClosingIntent(userText: string): boolean {
  const trimmed = userText.trim();
  return trimmed.length <= MAX_MESSAGE_LENGTH_FOR_CLOSING_INTENT && CLOSING_INTENT.test(trimmed);
}

/** After this many prior "is there another?" turns in a section, close it automatically rather than risk asking forever. */
const MAX_ASSISTANT_TURNS_BEFORE_FORCED_CLOSE = 4;

const NEUTRAL_CLOSING_MESSAGE = 'تمام، خلصنا القسم ده.';

/**
 * Whether `basic` can close without an email or a location is decided in code, not left to the
 * model's own judgment every turn — the same reasoning as the closing-intent/hard-cap logic above.
 * A missing field is only accepted once the model has already asked about it this many times
 * (detected by scanning its own prior messages for the relevant keyword) — matching "closes without
 * it only after the user has been asked and declined twice", not on the first pass.
 */
const REQUIRED_BASIC_FIELD_ASK_LIMIT = 2;
const EMAIL_MENTION = /إيميل|ايميل|email/i;
const LOCATION_MENTION = /مدينة|location/i;
const ASK_EMAIL_MESSAGE = 'طب ممكن آخد إيميلك كمان؟';
const ASK_LOCATION_MESSAGE = 'وإنت عايش في أي مدينة بالظبط؟';

function countAssistantMentions(history: LlmMessage[], pattern: RegExp): number {
  return history.filter((entry) => entry.role === 'assistant' && pattern.test(entry.content)).length;
}

/**
 * A section forced closed by the hard cap or a closing-intent match still has to drop any
 * trailing question — showing a card next to an unanswerable question is exactly the confusing
 * state the section_card + still-asking bug produced. Sentences are split on `.`/`!` (the shape
 * the model's own closing acknowledgments take, e.g. "تمام، خلصنا خبراتك. طب إيه وظيفتك هناك؟");
 * whichever sentence contains a question mark is dropped and the rest is kept. If nothing salvageable
 * remains (the whole message was just the question), a neutral closing line is used instead.
 */
function sanitizeForcedCloseMessage(message: string): string {
  if (!/[؟?]/.test(message)) {
    return message;
  }
  const sentences = message.split(/(?<=[.!])\s*/).filter((sentence) => sentence.trim().length > 0);
  const withoutQuestion = sentences.filter((sentence) => !/[؟?]/.test(sentence)).join(' ').trim();
  return withoutQuestion.length > 5 ? withoutQuestion : NEUTRAL_CLOSING_MESSAGE;
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return trimmed;
  }
  return trimmed.slice(start, end + 1);
}

/** The extraction call's output for array-shaped sections starts with `[`, not `{` — extractJsonObject only handles objects. */
function extractJsonValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    const end = trimmed.lastIndexOf(']');
    return end === -1 ? trimmed : trimmed.slice(0, end + 1);
  }
  return extractJsonObject(raw);
}

/**
 * The extraction call is told to return `[]` when there's genuinely nothing
 * for a section, but a small model occasionally hedges by returning a
 * single stub entry with every field null instead — a placeholder for "no
 * entry" rather than an actual entry. Dropping such stubs before validation
 * means that slip degrades to an empty array instead of failing the whole
 * turn. Only array-shaped output is affected; `parsed` is left untouched
 * otherwise.
 */
function dropAllNullEntries(parsed: unknown): unknown {
  if (!Array.isArray(parsed)) {
    return parsed;
  }
  return parsed.filter((entry) => !(entry && typeof entry === 'object' && Object.values(entry).every((value) => value === null)));
}

const ARABIC_CHAR = '[\\u0600-\\u06FF]';
const LATIN_CHAR = '[A-Za-z]';
const ARABIC_THEN_LATIN = new RegExp(`(${ARABIC_CHAR})(${LATIN_CHAR})`, 'g');
const LATIN_THEN_ARABIC = new RegExp(`(${LATIN_CHAR})(${ARABIC_CHAR})`, 'g');

/**
 * The model occasionally glues an English word directly onto an Arabic one
 * with no space (e.g. "إيهTasks") — a generation glitch, not a prompt
 * problem. Only the conversation's `message` needs this; card content is
 * meant to switch language by field, not mid-word, so it's never run over
 * card data.
 */
function insertArabicLatinBoundarySpace(text: string): string {
  return text.replace(ARABIC_THEN_LATIN, '$1 $2').replace(LATIN_THEN_ARABIC, '$1 $2');
}

type RetryOutcome<T> = { success: true; data: T } | { success: false };

/**
 * Two LLM calls per turn instead of one. A single prompt that both holds a
 * natural conversation AND extracts structured per-section data overloads a
 * small model — that's what caused a raw user message to get dumped
 * straight into the `name` field instead of being parsed. The conversation
 * call (short, behavior-focused) decides what to say and whether the
 * section is done; the extraction call (short, format-focused) runs only
 * once it's done, reading the same section transcript to produce the card.
 *
 * Neither call throws for a bad model output any more — an invalid or
 * unparseable reply is retried in the background, and if every retry is
 * exhausted, the caller degrades gracefully (a soft in-character message for
 * the conversation call, no card at all for extraction) instead of
 * surfacing a technical error to the user.
 */
@Injectable()
export class SectionReplyService {
  private readonly logger = new Logger(SectionReplyService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async generate(section: SectionId, history: LlmMessage[], userText: string, previousBestCard?: Record<string, unknown> | unknown[] | null): Promise<SectionReply> {
    const convMessages = buildConversationPrompt(section, history, userText);
    const convOutcome = await this.completeWithRetries(convMessages, extractJsonObject, (value) => conversationReplySchema.safeParse(value), CONVERSATION_RETRY_REMINDERS);

    if (!convOutcome.success) {
      this.logger.warn(`Conversation call failed after all retries (section: ${section}) — falling back to a soft in-character message.`);
      return { message: SOFT_FALLBACK_MESSAGE, section, sectionDone: false, hasNoExperience: false, card: null, skippedIncomplete: false };
    }

    const message = insertArabicLatinBoundarySpace(convOutcome.data.message);
    const hasNoExperience = section === 'experience' && convOutcome.data.hasNoExperience;
    let sectionDone = convOutcome.data.sectionDone;
    let finalMessage = message;
    let skippedIncomplete = false;

    // Closing a section is decided in code, not left entirely to the model: a user who's clearly
    // said "خلاص"/"مفيش" should close on the spot, and a section that's already asked "another
    // one?" this many times closes automatically rather than risk looping forever on a small
    // model that doesn't reliably recognize its own closing signals turn after turn.
    const priorAssistantTurns = history.filter((entry) => entry.role === 'assistant').length;
    const hardCapped = !hasNoExperience && priorAssistantTurns >= MAX_ASSISTANT_TURNS_BEFORE_FORCED_CLOSE;
    const closingIntentFired = !hasNoExperience && !hardCapped && hasClosingIntent(userText);

    if (hardCapped) {
      this.logger.warn(`Hard cap reached (${priorAssistantTurns} prior turns) — forcing sectionDone: true (section: ${section}).`);
      sectionDone = true;
    } else if (closingIntentFired) {
      if (!sectionDone) {
        this.logger.warn(`User signaled closing intent ("${userText}") — overriding sectionDone to true (section: ${section}).`);
      }
      sectionDone = true;
    }

    if (sectionDone && !hasNoExperience && /[؟?]/.test(finalMessage)) {
      if (hardCapped || closingIntentFired) {
        // The close is forced regardless of whether the model still wants to ask something —
        // dropping the trailing question is what keeps a card from appearing next to an
        // unanswerable one.
        finalMessage = sanitizeForcedCloseMessage(finalMessage);
        this.logger.warn(`Forced close still had a trailing question (section: ${section}) — message sanitized.`);
      } else {
        // A message that's still asking something can't also mean "this section is done" — except
        // the hasNoExperience pivot, where the question legitimately belongs to the section being
        // switched to.
        this.logger.warn(`Conversation call said sectionDone: true while still asking a question (section: ${section}) — overriding to false.`);
        sectionDone = false;
      }
    }

    let card: Record<string, unknown> | unknown[] | null = null;
    if (sectionDone && !hasNoExperience) {
      const fullHistory: LlmMessage[] = [...history, { role: 'user', content: userText }];
      // A closing-only message ("خلاص"/"مفيش") carries no data of its own, and the extraction call
      // has shown a tendency to latch onto it and report the whole section as empty. The message
      // still has to stay in the transcript (dropping it left the array ending on an assistant turn,
      // which the chat API rejects) — instead, the extraction prompt is told explicitly to disregard
      // it as a data source when deciding what's in the section.
      const closingMessageOnly = hasClosingIntent(userText) && history.length > 0;
      card = await this.extractCard(section, fullHistory, closingMessageOnly);

      if (card === null) {
        if (hardCapped) {
          // The hard cap already fired once and extraction still can't produce a card — re-asking
          // would just repeat this exact failure forever. Progress must not depend on extraction
          // succeeding: the section is left unconfirmed and the conversation moves on, rather than
          // the user being stuck repeating themselves with no way forward.
          this.logger.warn(`Extraction still failing after the hard cap (section: ${section}) — moving on without confirming this section.`);
          skippedIncomplete = true;
          finalMessage = SKIP_INCOMPLETE_MESSAGE;
        } else {
          // Extraction never produced anything usable — never show an empty or broken card. Falling
          // back to "not done yet" means the conversation just continues naturally instead of the
          // user seeing a confirm/edit card with nothing in it. The message that was about to go out
          // (often "تمام، خلصنا القسم ده" from the forced-close path) is now a lie — the section didn't
          // close — so it's replaced with the same honest, in-character prompt used for total call
          // failure.
          finalMessage = SOFT_FALLBACK_MESSAGE;
        }
        sectionDone = false;
      } else if (Array.isArray(card) && Array.isArray(previousBestCard) && card.length < previousBestCard.length) {
        // Losing a user's data is worse than showing a slightly stale card: if this turn's extraction
        // came back with fewer entries than the best one already produced for this section, that's
        // very likely the model dropping entries, not the user retracting them — keep the larger one.
        this.logger.warn(`New extraction (${card.length} entries) is smaller than a prior one (${previousBestCard.length}) for section ${section} — keeping the larger one.`);
        card = previousBestCard;
      } else if (section === 'basic' && card && !Array.isArray(card) && !hardCapped) {
        const basic = card as Record<string, unknown>;
        const emailAsks = countAssistantMentions(history, EMAIL_MENTION);
        const locationAsks = countAssistantMentions(history, LOCATION_MENTION);

        if (!basic.email && emailAsks < REQUIRED_BASIC_FIELD_ASK_LIMIT) {
          this.logger.warn(`Basic section would close without an email after only ${emailAsks} prior ask(s) — forcing one more turn.`);
          sectionDone = false;
          card = null;
          finalMessage = ASK_EMAIL_MESSAGE;
        } else if (!basic.location && locationAsks < REQUIRED_BASIC_FIELD_ASK_LIMIT) {
          this.logger.warn(`Basic section would close without a location after only ${locationAsks} prior ask(s) — forcing one more turn.`);
          sectionDone = false;
          card = null;
          finalMessage = ASK_LOCATION_MESSAGE;
        }
      }
    }

    return { message: finalMessage, section, sectionDone, hasNoExperience, card, skippedIncomplete };
  }

  /**
   * Returns `null` (never throws) when extraction can't produce a usable card — either every
   * retry failed outright, or the result stayed empty after a re-check despite real content
   * earlier in the section. Both are "don't show anything", not "show nothing and call it done".
   */
  private async extractCard(section: SectionId, sectionHistory: LlmMessage[], closingMessageOnly = false): Promise<Record<string, unknown> | unknown[] | null> {
    const extractionMessages = buildExtractionPrompt(section, sectionHistory, closingMessageOnly);
    const parse = (value: unknown): { success: true; data: Record<string, unknown> | unknown[] } | { success: false; error: { issues: unknown } } => {
      const result = CARD_SCHEMA_BY_SECTION[section].safeParse(dropAllNullEntries(value));
      return result.success ? { success: true, data: result.data as Record<string, unknown> | unknown[] } : { success: false, error: { issues: result.error.issues } };
    };

    const outcome = await this.completeWithRetries(extractionMessages, extractJsonValue, parse, [JSON_ONLY_REMINDER]);
    if (!outcome.success) {
      this.logger.warn(`Extraction failed after all retries (section: ${section}).`);
      return null;
    }

    // An empty array is a legitimate answer, but also the model's most likely failure mode: it can latch
    // onto a closing "مفيش"/"خلاص" in the last message and wipe out real entries mentioned earlier in the
    // same section. Only worth double-checking when there was more than one user turn — a section closed
    // on the very first reply was never going to have anything to lose.
    const hadMultipleUserTurns = sectionHistory.filter((entry) => entry.role === 'user').length > 1;
    if (Array.isArray(outcome.data) && outcome.data.length === 0 && hadMultipleUserTurns) {
      this.logger.warn(`Extraction returned an empty array after multiple user turns (section: ${section}) — re-checking once.`);
      const recheckMessages: LlmMessage[] = [...extractionMessages, { role: 'assistant', content: JSON.stringify(outcome.data) }, { role: 'user', content: EMPTY_ARRAY_REMINDER }];
      const recheckOutcome = await this.completeWithRetries(recheckMessages, extractJsonValue, parse, []);

      if (!recheckOutcome.success) {
        return null;
      }
      if (Array.isArray(recheckOutcome.data) && recheckOutcome.data.length === 0) {
        // Still empty despite real content earlier in the section — this is extraction failing to
        // find what's there, not the user having nothing. Don't confirm an empty card for it.
        this.logger.warn(`Extraction still empty after re-check despite multiple user turns (section: ${section}) — treating as a failed extraction.`);
        return null;
      }
      return recheckOutcome.data;
    }

    return outcome.data;
  }

  /**
   * Runs the completion, parses it as JSON, and validates it against `validate` — retrying with
   * each of `reminders` in turn on either a JSON-parse failure or a schema-validation failure.
   * Never throws: total failure just returns `{ success: false }`, leaving the caller to decide
   * how to degrade gracefully.
   */
  private async completeWithRetries<T>(
    messages: LlmMessage[],
    extract: (raw: string) => string,
    validate: (value: unknown) => { success: true; data: T } | { success: false; error: { issues: unknown } },
    reminders: string[],
  ): Promise<RetryOutcome<T>> {
    let currentMessages = messages;

    for (let attempt = 0; attempt <= reminders.length; attempt++) {
      const raw = await this.complete(currentMessages);
      const parsed = this.tryParse(raw, extract, attempt > 0);

      if (parsed !== undefined) {
        const result = validate(parsed);
        if (result.success) {
          return result;
        }
        this.logger.warn(`Output failed validation on attempt ${attempt + 1}: ${JSON.stringify(result.error.issues)}`);
      }

      if (attempt < reminders.length) {
        currentMessages = [...currentMessages, { role: 'assistant', content: raw }, { role: 'user', content: reminders[attempt] as string }];
      }
    }

    return { success: false };
  }

  private complete(messages: LlmMessage[]): Promise<string> {
    return this.llm.complete({ messages, temperature: 0.4, jsonMode: true });
  }

  private tryParse(raw: string, extract: (raw: string) => string, isRetry = false): unknown {
    try {
      return JSON.parse(extract(raw));
    } catch {
      this.logger.warn(`AI output was not valid JSON${isRetry ? ' (after retry)' : ''}: ${raw}`);
      return undefined;
    }
  }
}
