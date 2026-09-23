import type { SectionId } from '../../../common/types/contract.js';
import type { LlmCompletionOptions, LlmProvider } from '../llm.interface.js';

/**
 * One canned, schema-valid card per section, so the fake provider stays
 * valid against sectionReplySchema after a sectionDone reply. skills/
 * languages are arrays in the real schema (a user usually names several at
 * once), so their fake cards are too.
 */
const FAKE_CARD_BY_SECTION: Record<SectionId, (userText: string) => Record<string, unknown> | unknown[]> = {
  basic: (userText) => ({ name: userText, title: null, phone: null, email: null, location: null }),
  experience: (userText) => ({ title: userText, company: 'Fake Co', start: '2022', end: null, bullets: ['Did fake work'] }),
  projects: (userText) => ({ title: userText, description: 'A fake project', bullets: ['Did fake work'] }),
  education: (userText) => ({ degree: userText, school: 'Fake University', year: '2020' }),
  certificates: (userText) => ({ name: userText, date: null }),
  skills: (userText) => [{ name: userText, level: 'intermediate' }],
  languages: (userText) => [{ name: userText, level: 'intermediate' }],
};

/**
 * No network calls, no cost, no credentials needed — the default so a fresh
 * checkout works out of the box. Mimics the JSON shape ai/services/
 * section-reply expects ({message, section, card, sectionDone}) so the SSE
 * pipeline can be exercised end to end without a real model. It extracts
 * `current_section: <id>` from the system prompt — see
 * ai/prompts/section-reply.prompt.ts — since that's the one piece of
 * structure this fake needs; everything else is a canned reply.
 *
 * sectionDone is true whenever the user's message is longer than 15
 * characters — long enough to poke either branch on purpose while testing.
 */
export class FakeLlmProvider implements LlmProvider {
  async complete(options: LlmCompletionOptions): Promise<string> {
    return JSON.stringify(this.buildReply(options));
  }

  async *stream(options: LlmCompletionOptions): AsyncIterable<string> {
    yield JSON.stringify(this.buildReply(options));
  }

  private buildReply(options: LlmCompletionOptions): Record<string, unknown> {
    const system = options.messages.find((message) => message.role === 'system')?.content ?? '';
    const section = (/current_section:\s*(\w+)/.exec(system)?.[1] ?? 'basic') as SectionId;
    const userText = this.lastUserMessage(options);
    const sectionDone = userText.trim().length > 15;

    return {
      message: sectionDone
        ? 'تمام، فهمت. أعتقد جمعنا بيانات كفاية للقسم ده دلوقتي.'
        : 'تمام، ممكن تحكيلي كمان شوية عن كده؟',
      section,
      sectionDone,
      card: sectionDone ? (FAKE_CARD_BY_SECTION[section] ?? FAKE_CARD_BY_SECTION.basic)(userText) : null,
    };
  }

  private lastUserMessage(options: LlmCompletionOptions): string {
    return [...options.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
  }
}
