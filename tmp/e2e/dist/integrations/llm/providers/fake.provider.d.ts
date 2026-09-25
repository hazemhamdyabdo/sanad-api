import type { LlmCompletionOptions, LlmProvider } from '../llm.interface.js';
export declare class FakeLlmProvider implements LlmProvider {
    complete(options: LlmCompletionOptions): Promise<string>;
    stream(options: LlmCompletionOptions): AsyncIterable<string>;
    private buildReply;
    private buildConversationReply;
    private buildExtractionReply;
    private lastUserMessage;
}
