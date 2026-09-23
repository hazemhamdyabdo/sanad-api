import type { SectionId } from '../../../common/types/contract.js';
import type { LlmCompletionOptions, LlmProvider } from '../llm.interface.js';

type MultiEntrySection = 'experience' | 'education' | 'certificates';

/** Sections where a user typically has more than one entry — the fake asks "another one?" across turns instead of closing after the first. */
const MULTI_ENTRY_SECTIONS: MultiEntrySection[] = ['experience', 'education', 'certificates'];

/** A message containing one of these means "no more entries" — see buildReply's multi-entry branch. */
const CLOSE_SIGNAL = /مفيش|خلاص|no more|that'?s all|^done$/i;

/** One canned, schema-valid card for the single-entry sections. */
const FAKE_CARD_BY_SECTION: Record<Exclude<SectionId, MultiEntrySection>, (userText: string) => Record<string, unknown> | unknown[]> = {
  basic: (userText) => ({ name: userText, title: null, phone: null, email: null, location: null }),
  projects: (userText) => ({ title: userText, description: 'A fake project', bullets: ['Did fake work'] }),
  skills: (userText) => [{ name: userText, level: 'intermediate' }],
  languages: (userText) => [{ name: userText, level: 'intermediate' }],
};

/** One canned entry per multi-entry section — buildReply collects these into an array once the user signals there's no more. */
const FAKE_ENTRY_BY_SECTION: Record<MultiEntrySection, (userText: string) => Record<string, unknown>> = {
  experience: (userText) => ({ title: userText, company: 'Fake Co', start: '2022', end: null, bullets: ['Did fake work'] }),
  education: (userText) => ({ degree: userText, school: 'Fake University', year: '2020' }),
  certificates: (userText) => ({ name: userText, date: null }),
};

function isMultiEntrySection(section: SectionId): section is MultiEntrySection {
  return (MULTI_ENTRY_SECTIONS as SectionId[]).includes(section);
}

/**
 * No network calls, no cost, no credentials needed — the default so a fresh
 * checkout works out of the box. Mimics the JSON shape ai/services/
 * section-reply expects ({message, section, card, sectionDone}) so the SSE
 * pipeline can be exercised end to end without a real model. It extracts
 * `current_section: <id>` from the system prompt — see
 * ai/prompts/section-reply.prompt.ts — since that's the one piece of
 * structure this fake needs; everything else is a canned reply.
 *
 * For `experience`/`education`/`certificates` (multi-entry sections), it
 * simulates the "ask if there's another" flow across turns: every user
 * message becomes one entry and gets a "want to add another?" reply, until a
 * message matches CLOSE_SIGNAL, at which point all entries collected so far
 * (from the section-scoped history `options.messages` already carries) are
 * returned together and sectionDone fires. For everything else, sectionDone
 * is true whenever the single message is longer than 15 characters — long
 * enough to poke either branch on purpose while testing.
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

    if (isMultiEntrySection(section)) {
      return this.buildMultiEntryReply(section, options, userText);
    }

    const sectionDone = userText.trim().length > 15;
    return {
      message: sectionDone
        ? 'تمام، فهمت. أعتقد جمعنا بيانات كفاية للقسم ده دلوقتي.'
        : 'تمام، ممكن تحكيلي كمان شوية عن كده؟',
      section,
      sectionDone,
      card: sectionDone ? FAKE_CARD_BY_SECTION[section](userText) : null,
    };
  }

  private buildMultiEntryReply(section: MultiEntrySection, options: LlmCompletionOptions, userText: string): Record<string, unknown> {
    const isClosing = CLOSE_SIGNAL.test(userText);
    if (!isClosing) {
      return {
        message: 'تمام، وفي حاجة تانية تحب تضيفها؟',
        section,
        sectionDone: false,
        card: null,
      };
    }

    const priorEntries = this.priorUserMessages(options).map((text) => FAKE_ENTRY_BY_SECTION[section](text));
    return {
      message: 'تمام خلاص، هبقى أعرضلك كل اللي جمعناه.',
      section,
      sectionDone: true,
      card: priorEntries,
    };
  }

  /** Every user-role message except the current (last) one — the entries collected so far in this section. */
  private priorUserMessages(options: LlmCompletionOptions): string[] {
    return options.messages.filter((message) => message.role === 'user').map((message) => message.content).slice(0, -1);
  }

  private lastUserMessage(options: LlmCompletionOptions): string {
    return [...options.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
  }
}
