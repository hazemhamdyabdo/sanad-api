import { Logger } from '@nestjs/common';
import type { LlmCompletionOptions, LlmProvider } from '../llm.interface.js';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

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
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

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
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok || !response.body) {
      throw await this.toError(response);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
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

        const chunk = JSON.parse(payload) as MistralStreamChunk;
        const text = chunk.choices[0]?.delta.content;
        if (text) {
          yield text;
        }
      }
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
