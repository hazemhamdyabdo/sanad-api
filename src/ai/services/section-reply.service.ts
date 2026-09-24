import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error.js';
import type { SectionId } from '../../common/types/contract.js';
import { LLM_PROVIDER, type LlmMessage, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildConversationPrompt, buildExtractionPrompt } from '../prompts/section-reply.prompt.js';
import { CARD_SCHEMA_BY_SECTION, conversationReplySchema, type SectionReply } from '../schemas/section-reply.schema.js';

const JSON_ONLY_REMINDER = 'رد بكائن JSON بس، من غير أي نص قبله أو بعده.';

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

  async generate(section: SectionId, history: LlmMessage[], userText: string): Promise<SectionReply> {
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

    // A message that's still asking something can't also mean "this section is done" — except the
    // hasNoExperience pivot, where the question legitimately belongs to the section being switched to.
    if (sectionDone && !hasNoExperience && /[؟?]/.test(message)) {
      this.logger.warn(`Conversation call said sectionDone: true while still asking a question (section: ${section}) — overriding to false.`);
      sectionDone = false;
    }

    let card: Record<string, unknown> | unknown[] | null = null;
    if (sectionDone && !hasNoExperience) {
      const fullHistory: LlmMessage[] = [...history, { role: 'user', content: userText }];
      card = await this.extractCard(section, fullHistory);
    }

    return { message, section, sectionDone, hasNoExperience, card };
  }

  private async extractCard(section: SectionId, sectionHistory: LlmMessage[]): Promise<Record<string, unknown> | unknown[]> {
    const extractionMessages = buildExtractionPrompt(section, sectionHistory);
    const parsed = await this.completeJsonWithRetry(extractionMessages, extractJsonValue);
    const result = CARD_SCHEMA_BY_SECTION[section].safeParse(parsed);
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
