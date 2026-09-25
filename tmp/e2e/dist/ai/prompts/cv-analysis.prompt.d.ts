import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
export declare function buildCvAnalysisPrompt(pdf: Buffer, mimeType: string): LlmMessage[];
