import { Logger } from '@nestjs/common';
import { fetchWithTimeout, TimeoutError } from '../../../common/timeout.js';
import type { LlmCompletionOptions, LlmMessage, LlmProvider } from '../llm.interface.js';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
/**
 * For a `complete` call whose caller didn't say how long it normally takes. Generous on purpose —
 * the point is "never forever", not "fast": callers with a known profile pass their own `timeoutMs`.
 */
const DEFAULT_COMPLETION_TIMEOUT_MS = 90_000;
/** A stream that goes quiet this long — no headers, no next chunk — is dead, not thinking. */
const STREAM_IDLE_TIMEOUT_MS = 60_000;

type MistralContentPart = { type: 'text'; text: string } | { type: 'document_url'; document_url: string };
type MistralMessage = { role: LlmMessage['role']; content: string | MistralContentPart[] };

/** Mistral's chat completions API wants `content` as a plain string for a text-only message, or an array of typed parts once a document (or image) is attached — never both. */
function toMistralMessages(messages: LlmMessage[]): MistralMessage[] {
  return messages.map((message) => {
    if (!message.documents?.length) {
      return { role: message.role, content: message.content };
    }
    const parts: MistralContentPart[] = [{ type: 'text', text: message.content }];
    for (const doc of message.documents) {
      parts.push({ type: 'document_url', document_url: `data:${doc.mimeType};base64,${doc.data.toString('base64')}` });
    }
    return { role: message.role, content: parts };
  });
}

interface MistralUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface MistralChatResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: MistralUsage;
}

interface MistralStreamChunk {
  choices: Array<{ delta: { content?: string } }>;
}

/** Talks to the Mistral chat completions API directly over fetch — no SDK dependency needed for a shape this simple. */
export class MistralProvider implements LlmProvider {
  private readonly logger = new Logger(MistralProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(options: LlmCompletionOptions): Promise<string> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_COMPLETION_TIMEOUT_MS;
    const response = await fetchWithTimeout(
      MISTRAL_API_URL,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: this.model,
          messages: toMistralMessages(options.messages),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: false,
          response_format: options.jsonMode ? { type: 'json_object' } : undefined,
        }),
      },
      timeoutMs,
      `Mistral chat completion (${this.model})`,
    );

    if (!response.ok) {
      throw await this.toError(response);
    }

    const data = (await response.json()) as MistralChatResponse;
    if (data.usage) {
      this.logger.log(`usage: prompt=${data.usage.prompt_tokens} completion=${data.usage.completion_tokens} total=${data.usage.total_tokens} model=${this.model}`);
    }
    return data.choices[0]?.message.content ?? '';
  }

  async *stream(options: LlmCompletionOptions): AsyncIterable<string> {
    // An idle timeout rather than a total one: a long reply that keeps flowing is fine, a reply
    // that stops flowing is not. The timer is re-armed on every chunk and aborts the request when
    // it fires, which surfaces here as a rejected `read()`.
    const controller = new AbortController();
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const armIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(), STREAM_IDLE_TIMEOUT_MS);
    };
    const asTimeout = (error: unknown): unknown =>
      controller.signal.aborted ? new TimeoutError(`Mistral chat stream (${this.model}) idle`, STREAM_IDLE_TIMEOUT_MS) : error;

    armIdleTimer();
    let response: Response;
    try {
      response = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: this.model,
          messages: toMistralMessages(options.messages),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true,
          response_format: options.jsonMode ? { type: 'json_object' } : undefined,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(idleTimer);
      throw asTimeout(error);
    }

    if (!response.ok || !response.body) {
      clearTimeout(idleTimer);
      throw await this.toError(response);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        armIdleTimer();
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (error) {
          throw asTimeout(error);
        }
        const { done, value } = chunk;
        if (done) {
          return;
        }
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) {
            continue;
          }
          const payload = trimmed.slice('data:'.length).trim();
          if (payload === '[DONE]') {
            return;
          }

          const chunkData = JSON.parse(payload) as MistralStreamChunk;
          const text = chunkData.choices[0]?.delta.content;
          if (text) {
            yield text;
          }
        }
      }
    } finally {
      clearTimeout(idleTimer);
      reader.releaseLock();
    }
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async toError(response: Response): Promise<Error> {
    const body = await response.text().catch(() => '');
    return new Error(`Mistral API error ${response.status}: ${body}`);
  }
}
