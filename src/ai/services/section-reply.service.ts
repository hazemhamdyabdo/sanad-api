import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error.js';
import type { SectionId } from '../../common/types/contract.js';
import { LLM_PROVIDER, type LlmMessage, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildConversationPrompt, buildExtractionPrompt } from '../prompts/section-reply.prompt.js';
import { CARD_SCHEMA_BY_SECTION, conversationReplySchema, type SectionReply } from '../schemas/section-reply.schema.js';

const JSON_ONLY_REMINDER = 'رد بكائن JSON بس، من غير أي نص قبله أو بعده.';
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
 * turn with AI_UNAVAILABLE. Only array-shaped output is affected; `parsed`
 * is left untouched otherwise.
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

/**
 * Two LLM calls per turn instead of one. A single prompt that both holds a
 * natural conversation AND extracts structured per-section data overloads a
 * small model — that's what caused a raw user message to get dumped
 * straight into the `name` field instead of being parsed. The conversation
 * call (short, behavior-focused) decides what to say and whether the
 * section is done; the extraction call (short, format-focused) runs only
 * once it's done, reading the same section transcript to produce the card.
 */
@Injectable()
export class SectionReplyService {
  private readonly logger = new Logger(SectionReplyService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async generate(section: SectionId, history: LlmMessage[], userText: string, previousBestCard?: Record<string, unknown> | unknown[] | null): Promise<SectionReply> {
    const convMessages = buildConversationPrompt(section, history, userText);
    const convParsed = await this.completeJsonWithRetry(convMessages, extractJsonObject);
    const convResult = conversationReplySchema.safeParse(convParsed);
    if (!convResult.success) {
      this.logger.warn(`Conversation call failed validation: ${JSON.stringify(convResult.error.issues)}`);
      throw new AppError('AI_UNAVAILABLE', 'رد الذكاء الاصطناعي مش بالشكل المتوقع، جرب تاني', { retryable: true });
    }

    const message = insertArabicLatinBoundarySpace(convResult.data.message);
    const hasNoExperience = section === 'experience' && convResult.data.hasNoExperience;
    let sectionDone = convResult.data.sectionDone;

    // Closing a section is decided in code, not left entirely to the model: a user who's clearly
    // said "خلاص"/"مفيش" should close on the spot, and a section that's already asked "another
    // one?" this many times closes automatically rather than risk looping forever on a small
    // model that doesn't reliably recognize its own closing signals turn after turn.
    const priorAssistantTurns = history.filter((entry) => entry.role === 'assistant').length;
    if (!hasNoExperience && priorAssistantTurns >= MAX_ASSISTANT_TURNS_BEFORE_FORCED_CLOSE) {
      this.logger.warn(`Hard cap reached (${priorAssistantTurns} prior turns) — forcing sectionDone: true (section: ${section}).`);
      sectionDone = true;
    } else if (!hasNoExperience && hasClosingIntent(userText)) {
      if (!sectionDone) {
        this.logger.warn(`User signaled closing intent ("${userText}") — overriding sectionDone to true (section: ${section}).`);
      }
      sectionDone = true;
    } else if (sectionDone && !hasNoExperience && /[؟?]/.test(message)) {
      // A message that's still asking something can't also mean "this section is done" — except the
      // hasNoExperience pivot, where the question legitimately belongs to the section being switched to.
      this.logger.warn(`Conversation call said sectionDone: true while still asking a question (section: ${section}) — overriding to false.`);
      sectionDone = false;
    }

    let card: Record<string, unknown> | unknown[] | null = null;
    if (sectionDone && !hasNoExperience) {
      const fullHistory: LlmMessage[] = [...history, { role: 'user', content: userText }];
      card = await this.extractCard(section, fullHistory);

      // Losing a user's data is worse than showing a slightly stale card: if this turn's extraction
      // came back with fewer entries than the best one already produced for this section, that's
      // very likely the model dropping entries, not the user retracting them — keep the larger one.
      if (Array.isArray(card) && Array.isArray(previousBestCard) && card.length < previousBestCard.length) {
        this.logger.warn(`New extraction (${card.length} entries) is smaller than a prior one (${previousBestCard.length}) for section ${section} — keeping the larger one.`);
        card = previousBestCard;
      }
    }

    return { message, section, sectionDone, hasNoExperience, card };
  }

  private async extractCard(section: SectionId, sectionHistory: LlmMessage[]): Promise<Record<string, unknown> | unknown[]> {
    const extractionMessages = buildExtractionPrompt(section, sectionHistory);
    const parsed = await this.completeJsonWithRetry(extractionMessages, extractJsonValue);
    const cleaned = dropAllNullEntries(parsed);

    // An empty array is a legitimate answer, but also the model's most likely failure mode: it can latch
    // onto a closing "مفيش"/"خلاص" in the last message and wipe out real entries mentioned earlier in the
    // same section. Only worth double-checking when there was more than one user turn — a section closed
    // on the very first reply was never going to have anything to lose. This has to run on the raw parsed
    // value, before schema validation — a schema with a `.min(1)` on the array would otherwise throw before
    // this check ever got a chance to trigger a retry.
    const hadMultipleUserTurns = sectionHistory.filter((entry) => entry.role === 'user').length > 1;
    if (Array.isArray(cleaned) && cleaned.length === 0 && hadMultipleUserTurns) {
      this.logger.warn(`Extraction returned an empty array after multiple user turns (section: ${section}) — re-checking once.`);
      const recheckMessages: LlmMessage[] = [...extractionMessages, { role: 'assistant', content: JSON.stringify(parsed) }, { role: 'user', content: EMPTY_ARRAY_REMINDER }];
      const recheckParsed = await this.completeJsonWithRetry(recheckMessages, extractJsonValue);
      return this.parseCard(section, recheckParsed);
    }

    return this.parseCard(section, parsed);
  }

  private parseCard(section: SectionId, parsed: unknown): Record<string, unknown> | unknown[] {
    const result = CARD_SCHEMA_BY_SECTION[section].safeParse(dropAllNullEntries(parsed));
    if (!result.success) {
      this.logger.warn(`Extraction call failed validation (section: ${section}): ${JSON.stringify(result.error.issues)}`);
      throw new AppError('AI_UNAVAILABLE', 'رد الذكاء الاصطناعي مش بالشكل المتوقع، جرب تاني', { retryable: true });
    }
    return result.data as Record<string, unknown> | unknown[];
  }

  /** Shared retry-once-on-bad-JSON flow used by both the conversation and extraction calls. */
  private async completeJsonWithRetry(messages: LlmMessage[], extract: (raw: string) => string): Promise<unknown> {
    const first = await this.complete(messages);
    const parsed = this.tryParse(first, extract);
    if (parsed !== undefined) {
      return parsed;
    }

    this.logger.warn('AI output was not valid JSON — retrying once with a JSON-only reminder.');
    const retryMessages: LlmMessage[] = [...messages, { role: 'assistant', content: first }, { role: 'user', content: JSON_ONLY_REMINDER }];
    const retry = await this.complete(retryMessages);
    const retryParsed = this.tryParse(retry, extract, true);
    if (retryParsed === undefined) {
      throw new AppError('AI_UNAVAILABLE', 'مش قادرين نفهم رد الذكاء الاصطناعي دلوقتي، جرب تاني', { retryable: true });
    }
    return retryParsed;
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
