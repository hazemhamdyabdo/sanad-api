import type { LlmCompletionOptions, LlmProvider } from '../llm.interface.js';
export declare class MistralProvider implements LlmProvider {
    private readonly apiKey;
    private readonly model;
    private readonly logger;
    constructor(apiKey: string, model: string);
    complete(options: LlmCompletionOptions): Promise<string>;
    stream(options: LlmCompletionOptions): AsyncIterable<string>;
    private headers;
    private toError;
}
