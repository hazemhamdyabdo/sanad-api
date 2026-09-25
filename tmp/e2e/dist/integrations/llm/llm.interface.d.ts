export interface LlmMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    documents?: Array<{
        data: Buffer;
        mimeType: string;
    }>;
}
export interface LlmCompletionOptions {
    messages: LlmMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}
export interface LlmProvider {
    complete(options: LlmCompletionOptions): Promise<string>;
    stream(options: LlmCompletionOptions): AsyncIterable<string>;
}
export declare const LLM_PROVIDER: unique symbol;
export declare const EXTRACTION_LLM_PROVIDER: unique symbol;
