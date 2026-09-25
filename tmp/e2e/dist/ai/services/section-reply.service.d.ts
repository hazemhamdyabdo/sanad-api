import type { SectionId } from '../../common/types/contract.js';
import { type LlmMessage, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { type SectionReply } from '../schemas/section-reply.schema.js';
export declare class SectionReplyService {
    private readonly llm;
    private readonly extractionLlm;
    private readonly logger;
    constructor(llm: LlmProvider, extractionLlm: LlmProvider);
    generate(section: SectionId, history: LlmMessage[], userText: string, previousBestCard?: Record<string, unknown> | unknown[] | null): Promise<SectionReply>;
    private extractCard;
    private completeWithRetries;
    private complete;
    private tryParse;
}
