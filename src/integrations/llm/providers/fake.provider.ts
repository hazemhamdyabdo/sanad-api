import type { LlmCompletionOptions, LlmProvider } from '../llm.interface.js';

/** No network calls, no cost, no credentials needed — the default so a fresh checkout works out of the box. */
export class FakeLlmProvider implements LlmProvider {
  async complete(options: LlmCompletionOptions): Promise<string> {
    return `[fake reply to: ${this.lastUserMessage(options)}]`;
  }

  async *stream(options: LlmCompletionOptions): AsyncIterable<string> {
    const reply = `[fake reply to: ${this.lastUserMessage(options)}]`;
    for (const word of reply.split(' ')) {
      yield `${word} `;
    }
  }

  private lastUserMessage(options: LlmCompletionOptions): string {
    return [...options.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
  }
}
