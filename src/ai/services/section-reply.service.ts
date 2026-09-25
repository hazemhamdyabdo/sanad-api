import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SectionId } from '../../common/types/contract.js';
import { EXTRACTION_LLM_PROVIDER, LLM_PROVIDER, type LlmMessage, type LlmProvider } from '../../integrations/llm/llm.interface.js';
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
 * A section is NEVER skipped or left empty because the model couldn't structure what the user said —
 * the conversation stays in the section and asks a specific clarifying question instead, until a real
 * card comes out and the user confirms it. Each section has a few differently-worded questions, each
 * asking for exactly what the card needs, rotated so the user never gets the same line twice in a row.
 */
const CLARIFY_QUESTIONS_BY_SECTION: Record<SectionId, string[]> = {
  basic: ['معلش، عايز أكتبها صح — ممكن تقولي اسمك بالكامل تاني؟', 'تمام، وإيه المسمى الوظيفي اللي تحب يتكتب في الـ CV؟'],
  experience: [
    'معلش، عايز أكتبها صح — إيه المسمى الوظيفي بالظبط، وكنت شغال في أنهي شركة أو مكان؟',
    'تمام، وكنت بتعمل إيه هناك بالظبط؟ قولي حاجتين أو تلاتة من شغلك اليومي.',
    'خليني أتأكد — كنت شغال فين، وبتعمل إيه هناك في جملة واحدة؟',
  ],
  projects: [
    'معلش، عايز أكتبها صح — إيه اسم المشروع، وكان بيعمل إيه باختصار؟',
    'تمام، وإنت بالظبط عملت إيه فيه؟ قولي حاجتين أو تلاتة.',
  ],
  education: [
    'معلش، عايز أكتبها صح — إيه اسم المؤهل بالظبط، ومن أنهي جامعة أو مدرسة؟',
    'خليني أتأكد — اتخرجت من أنهي كلية أو مدرسة، والشهادة اسمها إيه؟',
  ],
  certificates: [
    'معلش، عايز أكتبها صح — إيه اسم الشهادة أو الكورس بالظبط؟',
    'خليني أتأكد — الكورس ده كان اسمه إيه، ومن أنهي جهة؟',
  ],
  skills: [
    'معلش، عايز أكتبها صح — قولي المهارات تاني، وجنب كل واحدة مستواك: مبتدئ، متوسط، متقدم، ولا خبير؟',
    'خليني أتأكد — إيه المهارات اللي تحب تتكتب، ومستواك في كل واحدة؟',
  ],
  languages: [
    'معلش، عايز أكتبها صح — إيه اللغات اللي بتتكلمها، ومستواك في كل واحدة؟ (العربي لغة أم مثلًا)',
    'خليني أتأكد — قولي كل لغة ومستواك فيها.',
  ],
};

/**
 * The only sections that may legitimately have nothing in them. When the (stronger) extraction model
 * finds nothing twice here, the user gets an empty card to confirm ("no certificates") — still their
 * explicit decision, never a silent skip. Every other section must end with real entries.
 */
const SECTIONS_ALLOWED_EMPTY: SectionId[] = ['certificates'];

function clarifyingQuestion(section: SectionId, history: LlmMessage[]): string {
  const questions = CLARIFY_QUESTIONS_BY_SECTION[section];
  const alreadyAsked = history.filter((entry) => entry.role === 'assistant' && questions.includes(entry.content)).length;
  return questions[alreadyAsked % questions.length] as string;
}
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
const CLOSING_INTENT = /خلاص|مفيش|بس كد[اه]|كد[اه] بس|تمام كد[اه]|كد[اه] تمام|كفاية|خلصنا|خلصت|^(لا|لأ|لاء)[،,]?\s*(شكر|تمام|مفيش|خلاص)/;
const MAX_MESSAGE_LENGTH_FOR_CLOSING_INTENT = 40;

function hasClosingIntent(userText: string): boolean {
  const trimmed = userText.trim();
  return trimmed.length <= MAX_MESSAGE_LENGTH_FOR_CLOSING_INTENT && CLOSING_INTENT.test(trimmed);
}

const NEUTRAL_CLOSING_MESSAGE = 'تمام، خلصنا القسم ده.';

/**
 * The model's own closing line (the prompt suggests "تمام، كده خلصنا البيانات دي، بص عليها تحت") —
 * it sometimes writes exactly that while still returning `sectionDone: false`, which left the user
 * told to "look below" at a card that never came. A message that says it's done and asks nothing is
 * treated as done, in code, rather than trusting the flag.
 */
const MODEL_CLOSING_PHRASE = /بص عليها تحت|بص عليه تحت|بصي عليها تحت|خلصنا/;

function soundsLikeClosing(message: string): boolean {
  return MODEL_CLOSING_PHRASE.test(message) && !/[؟?]/.test(message);
}

/**
 * Whether a section can close with a required field still missing is decided in code, not left to
 * the model's own judgment every turn — the same reasoning as the closing-intent/hard-cap logic
 * above. A rule is "satisfied" once ANY of its `fields` is non-empty on the extracted card (used for
 * "phone or email — at least one"); otherwise the section is held open and `ask` (a fixed, varied-per-
 * field question) is forced as this turn's message instead of whatever the model produced.
 *
 * Detecting the model's own *spontaneous* phrasing of the same question reliably is not realistic —
 * Egyptian colloquial has too many ways to ask "what's your job title?" to pattern-match. So `mention`
 * only has to guarantee one thing: it MUST match `ask`'s own text (asserted below), so that once this
 * rule has forced its own canned question, the next turn's count reliably includes it — guaranteeing
 * the section always gets past a missing field after `REQUIRED_FIELD_ASK_LIMIT` forced ask, rather
 * than looping on it forever. It's fine (and expected) if the model happened to ask about the same
 * thing in its own words first — that just means the canned question shows up starting one turn
 * later than the user's very first "I don't know" on the topic, not that it never arrives.
 *
 * Only object-shaped cards need this: the array-shaped sections (experience, education, ...) already
 * have their truly-required fields (company, school, ...) as non-nullable in `CARD_SCHEMA_BY_SECTION`
 * itself, so extraction can't produce a null there in the first place — the fields left nullable on
 * those (e.g. an ongoing job's `end`, an unknown certificate `date`) are genuinely optional, not
 * missing data to chase.
 */
const REQUIRED_FIELD_ASK_LIMIT = 1;

interface RequiredFieldRule {
  /** Satisfied once any one of these keys is non-empty on the card. */
  fields: string[];
  ask: string;
  /** Must match `ask` itself — see the block comment above. */
  mention: RegExp;
}

const REQUIRED_FIELDS_BY_SECTION: Partial<Record<SectionId, RequiredFieldRule[]>> = {
  basic: [
    { fields: ['title'], ask: 'طب إيه المسمى الوظيفي بتاعك، أو الوظيفة اللي بتدور عليها؟', mention: /المسمى الوظيفي/i },
    { fields: ['phone', 'email'], ask: 'ممكن آخد رقم موبايلك أو إيميلك؟', mention: /رقم موبايلك أو إيميلك/i },
  ],
};

for (const rules of Object.values(REQUIRED_FIELDS_BY_SECTION)) {
  for (const rule of rules ?? []) {
    if (!rule.mention.test(rule.ask)) {
      throw new Error(`RequiredFieldRule misconfigured: mention pattern ${rule.mention} doesn't match its own ask text "${rule.ask}".`);
    }
  }
}

function hasEntries(card: Record<string, unknown> | unknown[] | null | undefined): card is Record<string, unknown> | unknown[] {
  if (!card) return false;
  return Array.isArray(card) ? card.length > 0 : Object.keys(card).length > 0;
}

function countAssistantMentions(history: LlmMessage[], pattern: RegExp): number {
  return history.filter((entry) => entry.role === 'assistant' && pattern.test(entry.content)).length;
}

/** The first unmet rule (if any) whose missing field hasn't already been asked about once. */
function findUnmetRequiredField(rules: RequiredFieldRule[], card: Record<string, unknown>, history: LlmMessage[]): RequiredFieldRule | null {
  for (const rule of rules) {
    const satisfied = rule.fields.some((field) => !!card[field]);
    if (satisfied) {
      continue;
    }
    if (countAssistantMentions(history, rule.mention) < REQUIRED_FIELD_ASK_LIMIT) {
      return rule;
    }
  }
  return null;
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

const CONVERSATION_CALL = 'conversation';
const EXTRACTION_CALL = 'extraction';
type CallKind = typeof CONVERSATION_CALL | typeof EXTRACTION_CALL;

/**
 * `empty` = the model looked twice and found nothing (e.g. no certificates).
 * `failed` = it couldn't produce a valid card at all.
 * Outside SECTIONS_ALLOWED_EMPTY both mean the same thing: ask the user to clarify.
 */
type ExtractionOutcome = { kind: 'card'; card: Record<string, unknown> | unknown[] } | { kind: 'empty' } | { kind: 'failed' };

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

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    @Inject(EXTRACTION_LLM_PROVIDER) private readonly extractionLlm: LlmProvider,
  ) {}

  async generate(section: SectionId, history: LlmMessage[], userText: string, previousBestCard?: Record<string, unknown> | unknown[] | null): Promise<SectionReply> {
    const convMessages = buildConversationPrompt(section, history, userText);
    const convOutcome = await this.completeWithRetries(convMessages, extractJsonObject, (value) => conversationReplySchema.safeParse(value), CONVERSATION_RETRY_REMINDERS);

    if (!convOutcome.success) {
      this.logger.warn(`Conversation call failed after all retries (section: ${section}) — falling back to a soft in-character message.`);
      return { message: SOFT_FALLBACK_MESSAGE, section, sectionDone: false, hasNoExperience: false, card: null };
    }

    const message = insertArabicLatinBoundarySpace(convOutcome.data.message);
    const hasNoExperience = section === 'experience' && convOutcome.data.hasNoExperience;
    let sectionDone = convOutcome.data.sectionDone;
    let finalMessage = message;

    if (!sectionDone && !hasNoExperience && soundsLikeClosing(message)) {
      this.logger.warn(`Model wrote a closing message but sectionDone: false (section: ${section}) — overriding to true.`);
      sectionDone = true;
    }

    // An explicit short "خلاص" is safe to recognize in code. Turn counts are not: a useful answer
    // can arrive on any turn, so a budget must never close or discard a section.
    const closingIntentFired = !hasNoExperience && hasClosingIntent(userText);

    if (closingIntentFired) {
      if (!sectionDone) {
        this.logger.warn(`User signaled closing intent ("${userText}") — overriding sectionDone to true (section: ${section}).`);
      }
      sectionDone = true;
    }

    if (sectionDone && !hasNoExperience && /[؟?]/.test(finalMessage)) {
      if (closingIntentFired) {
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
      const extraction = await this.extractCard(section, fullHistory, closingMessageOnly, previousBestCard);
      card = extraction.kind === 'card' ? extraction.card : null;

      if (card && previousBestCard && !Array.isArray(card) && !Array.isArray(previousBestCard)) {
        const suppliedValues = Object.fromEntries(Object.entries(card).filter(([, value]) => value !== null && value !== undefined && value !== ''));
        card = { ...previousBestCard, ...suppliedValues };
      }

      if (extraction.kind === 'empty' && SECTIONS_ALLOWED_EMPTY.includes(section)) {
        // The user has none (e.g. no certificates) — shown as an empty card for them to confirm.
        card = [];
      }

      if (card === null && hasEntries(previousBestCard)) {
        // An earlier turn in this section already produced a real card — show that rather than lose it.
        this.logger.warn(`Extraction failed but a prior card exists (section: ${section}) — reusing it.`);
        card = previousBestCard;
      }

      if (card === null) {
        // Never advance past a section we couldn't structure, and never leave it empty: stay here and
        // ask for exactly what the card needs. The full transcript is persisted, so extraction runs
        // over everything again on the next reply — the user only adds, never repeats their whole story.
        this.logger.warn(`No card for section ${section} (${extraction.kind}) — asking the user to clarify.`);
        finalMessage = clarifyingQuestion(section, history);
        sectionDone = false;
      } else if (Array.isArray(card) && Array.isArray(previousBestCard) && card.length < previousBestCard.length) {
        // Losing a user's data is worse than showing a slightly stale card: if this turn's extraction
        // came back with fewer entries than the best one already produced for this section, that's
        // very likely the model dropping entries, not the user retracting them — keep the larger one.
        this.logger.warn(`New extraction (${card.length} entries) is smaller than a prior one (${previousBestCard.length}) for section ${section} — keeping the larger one.`);
        card = previousBestCard;
      } else if (!Array.isArray(card)) {
        const rules = REQUIRED_FIELDS_BY_SECTION[section];
        const unmet = rules ? findUnmetRequiredField(rules, card as Record<string, unknown>, history) : null;
        if (unmet) {
          this.logger.warn(`${section} would close missing a required field (one of: ${unmet.fields.join('/')}) — forcing one more turn.`);
          sectionDone = false;
          card = null;
          finalMessage = unmet.ask;
        }
      }
    }

    return { message: finalMessage, section, sectionDone, hasNoExperience, card };
  }

  /**
   * Returns `null` (never throws) when extraction can't produce a usable card — either every
   * retry failed outright, or the result stayed empty after a re-check despite real content
   * earlier in the section. Both are "don't show anything", not "show nothing and call it done".
   */
  private async extractCard(
    section: SectionId,
    sectionHistory: LlmMessage[],
    closingMessageOnly = false,
    existingCard?: Record<string, unknown> | unknown[] | null,
  ): Promise<ExtractionOutcome> {
    const extractionMessages = buildExtractionPrompt(section, sectionHistory, closingMessageOnly, existingCard);
    const parse = (value: unknown): { success: true; data: Record<string, unknown> | unknown[] } | { success: false; error: { issues: unknown } } => {
      const result = CARD_SCHEMA_BY_SECTION[section].safeParse(dropAllNullEntries(value));
      return result.success ? { success: true, data: result.data as Record<string, unknown> | unknown[] } : { success: false, error: { issues: result.error.issues } };
    };

    const outcome = await this.completeWithRetries(extractionMessages, extractJsonValue, parse, [JSON_ONLY_REMINDER], EXTRACTION_CALL);
    if (!outcome.success) {
      this.logger.warn(`Extraction failed after all retries (section: ${section}).`);
      return { kind: 'failed' };
    }

    // An empty array is a legitimate answer, but also the model's most likely failure mode: it can latch
    // onto a closing "مفيش"/"خلاص" in the last message and wipe out real entries mentioned earlier in the
    // same section. Only worth double-checking when there was more than one user turn — a section closed
    // on the very first reply was never going to have anything to lose.
    const hadMultipleUserTurns = sectionHistory.filter((entry) => entry.role === 'user').length > 1;
    if (Array.isArray(outcome.data) && outcome.data.length === 0 && hadMultipleUserTurns) {
      this.logger.warn(`Extraction returned an empty array after multiple user turns (section: ${section}) — re-checking once.`);
      const recheckMessages: LlmMessage[] = [...extractionMessages, { role: 'assistant', content: JSON.stringify(outcome.data) }, { role: 'user', content: EMPTY_ARRAY_REMINDER }];
      const recheckOutcome = await this.completeWithRetries(recheckMessages, extractJsonValue, parse, [], EXTRACTION_CALL);

      if (!recheckOutcome.success) {
        return { kind: 'failed' };
      }
      if (Array.isArray(recheckOutcome.data) && recheckOutcome.data.length === 0) {
        // Empty twice, from the (stronger) extraction model: the user most likely has nothing here.
        this.logger.warn(`Extraction still empty after re-check (section: ${section}).`);
        return { kind: 'empty' };
      }
      return { kind: 'card', card: recheckOutcome.data };
    }

    return { kind: 'card', card: outcome.data };
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
    call: CallKind = CONVERSATION_CALL,
  ): Promise<RetryOutcome<T>> {
    let currentMessages = messages;

    for (let attempt = 0; attempt <= reminders.length; attempt++) {
      const raw = await this.complete(currentMessages, call);
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

  private complete(messages: LlmMessage[], call: CallKind): Promise<string> {
    const llm = call === EXTRACTION_CALL ? this.extractionLlm : this.llm;
    return llm.complete({ messages, temperature: call === EXTRACTION_CALL ? 0 : 0.4, jsonMode: true });
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
