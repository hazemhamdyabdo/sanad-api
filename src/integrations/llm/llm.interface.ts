export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider to enforce valid JSON output at the API level, when it can (e.g. Mistral/OpenAI's `response_format: json_object`). A provider that can't enforce this just ignores it — the caller must still validate the result either way. */
  jsonMode?: boolean;
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

/** Same port, bound to the (stronger) model used for structured extraction rather than conversation. */
export const EXTRACTION_LLM_PROVIDER = Symbol('EXTRACTION_LLM_PROVIDER');
