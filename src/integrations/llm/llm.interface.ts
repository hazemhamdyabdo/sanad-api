export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * The port every business module depends on. Never import a vendor SDK, an
 * HTTP client, or a raw provider response outside integrations/ — swapping
 * providers should be a one-file change in providers/ + llm.module.ts.
 */
export interface LlmProvider {
  complete(options: LlmCompletionOptions): Promise<string>;
  stream(options: LlmCompletionOptions): AsyncIterable<string>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
