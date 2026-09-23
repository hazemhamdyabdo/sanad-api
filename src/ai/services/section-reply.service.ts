import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error.js';
import type { SectionId } from '../../common/types/contract.js';
import { LLM_PROVIDER, type LlmMessage, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildSectionReplyPrompt } from '../prompts/section-reply.prompt.js';
import { sectionReplySchema, type SectionReply } from '../schemas/section-reply.schema.js';

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

const ARABIC_CHAR = '[\\u0600-\\u06FF]';
const LATIN_CHAR = '[A-Za-z]';
const ARABIC_THEN_LATIN = new RegExp(`(${ARABIC_CHAR})(${LATIN_CHAR})`, 'g');
const LATIN_THEN_ARABIC = new RegExp(`(${LATIN_CHAR})(${ARABIC_CHAR})`, 'g');

/**
 * The model occasionally glues an English word directly onto an Arabic one
 * with no space (e.g. "إيهTasks") — a generation glitch, not a prompt
 * problem. Only `message` needs this; `card` content is meant to switch
 * language by field (e.g. an English job title next to nothing), not
 * mid-word, so it's never run over card data.
 */
function insertArabicLatinBoundarySpace(text: string): string {
  return text.replace(ARABIC_THEN_LATIN, '$1 $2').replace(LATIN_THEN_ARABIC, '$1 $2');
}

@Injectable()
export class SectionReplyService {
  private readonly logger = new Logger(SectionReplyService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async generate(section: SectionId, history: LlmMessage[], userText: string): Promise<SectionReply> {
    const messages = buildSectionReplyPrompt(section, history, userText);

    const first = await this.complete(messages);
    const parsed = this.tryParse(first);
    if (parsed !== undefined) {
      return this.validate(parsed);
    }

    // One retry with a short reminder, since losing the user's turn over a pure formatting slip is a bad experience.
    this.logger.warn('AI output was not valid JSON — retrying once with a JSON-only reminder.');
    const retryMessages: LlmMessage[] = [...messages, { role: 'assistant', content: first }, { role: 'user', content: JSON_ONLY_REMINDER }];
    const retry = await this.complete(retryMessages);
    const retryParsed = this.tryParse(retry, true);
    if (retryParsed === undefined) {
      throw new AppError('AI_UNAVAILABLE', 'مش قادرين نفهم رد الذكاء الاصطناعي دلوقتي، جرب تاني', { retryable: true });
    }

    return this.validate(retryParsed);
  }

  private complete(messages: LlmMessage[]): Promise<string> {
    return this.llm.complete({ messages, temperature: 0.4, jsonMode: true });
  }

  private tryParse(raw: string, isRetry = false): unknown {
    try {
      return JSON.parse(extractJsonObject(raw));
    } catch {
      this.logger.warn(`AI output was not valid JSON${isRetry ? ' (after retry)' : ''}: ${raw}`);
      return undefined;
    }
  }

  private validate(parsed: unknown): SectionReply {
    const result = sectionReplySchema.safeParse(parsed);
    if (!result.success) {
      this.logger.warn(`AI output failed validation: ${JSON.stringify(result.error.issues)}`);
      throw new AppError('AI_UNAVAILABLE', 'رد الذكاء الاصطناعي مش بالشكل المتوقع، جرب تاني', { retryable: true });
    }

    const data = result.data;
    const message = insertArabicLatinBoundarySpace(data.message);

    // A card only ever means anything once sectionDone is true — nothing renders or persists it otherwise, so a stray one is dropped rather than failing the whole reply.
    if (!data.sectionDone && data.card !== null) {
      this.logger.warn(`AI sent a card while sectionDone was false (section: ${data.section}) — dropping it.`);
      return { ...data, message, card: null };
    }

    return { ...data, message };
  }
}
