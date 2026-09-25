import { type SectionId } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
export declare function buildConversationPrompt(section: SectionId, history: LlmMessage[], userText: string): LlmMessage[];
export declare function buildExtractionPrompt(section: SectionId, history: LlmMessage[], closingMessageOnly?: boolean, existingCard?: Record<string, unknown> | unknown[] | null): LlmMessage[];
