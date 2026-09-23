import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error.js';
import type { SectionId } from '../../common/types/contract.js';
import { LLM_PROVIDER, type LlmMessage, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildSectionReplyPrompt } from '../prompts/section-reply.prompt.js';
import { sectionReplySchema, type SectionReply } from '../schemas/section-reply.schema.js';

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return trimmed;
  }
  return trimmed.slice(start, end + 1);
}

@Injectable()
export class SectionReplyService {
  private readonly logger = new Logger(SectionReplyService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async generate(section: SectionId, history: LlmMessage[], userText: string): Promise<SectionReply> {
    const messages = buildSectionReplyPrompt(section, history, userText);
    const raw = await this.llm.complete({ messages, temperature: 0.4 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonObject(raw));
    } catch {
      this.logger.warn(`AI output was not valid JSON: ${raw}`);
      throw new AppError('AI_UNAVAILABLE', 'مش قادرين نفهم رد الذكاء الاصطناعي دلوقتي، جرب تاني', { retryable: true });
    }

    const result = sectionReplySchema.safeParse(parsed);
    if (!result.success) {
      this.logger.warn(`AI output failed validation: ${JSON.stringify(result.error.issues)}`);
      throw new AppError('AI_UNAVAILABLE', 'رد الذكاء الاصطناعي مش بالشكل المتوقع، جرب تاني', { retryable: true });
    }

    return result.data;
  }
}
