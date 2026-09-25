import type { SectionId } from '../../../common/types/contract.js';
import type { LlmCompletionOptions, LlmProvider } from '../llm.interface.js';

type MultiEntrySection = 'experience' | 'education' | 'certificates';

/** Sections where a user typically has more than one entry — the fake asks "another one?" across turns instead of closing after the first. */
const MULTI_ENTRY_SECTIONS: MultiEntrySection[] = ['experience', 'education', 'certificates'];

/** A message containing one of these means "no more entries" — see buildConversationReply's multi-entry branch. */
const CLOSE_SIGNAL = /مفيش|خلاص|no more|that'?s all|^done$/i;

/** A message containing one of these in the experience section means "I've never worked" — mirrors the real prompt's hasNoExperience trigger words. */
const NO_EXPERIENCE_SIGNAL = /مشتغلش|مشتغلتش|معنديش خبرة|لسه متخرج/;

/** Marker unique to the extraction prompt's system message (see ai/prompts/section-reply.prompt.ts) — distinguishes it from the conversation call, which shares the same `current_section: <id>` line. */
const EXTRACTION_MARKER = 'استخرج البيانات';

/** Marker unique to the CV-upload analysis prompt (see ai/prompts/cv-analysis.prompt.ts) — a separate, self-contained prompt with no `current_section` line. */
const CV_ANALYSIS_MARKER = 'حلل ملف السيرة الذاتية';

/** One fixed, schema-valid analysis — ignores the actual attached PDF (fake mode never reads document bytes), just enough shape for the upload pipeline to be exercised without a real key. */
const FAKE_CV_ANALYSIS = {
  cv: {
    basic: { name: 'Fake User', title: 'Fake Title', phone: '+201000000000', email: 'fake@example.com', location: 'Cairo, Egypt' },
    experience: [{ title: 'Fake Title', company: 'Fake Co', start: '2022', end: null, bullets: ['Did fake work'] }],
    projects: [],
    education: [{ degree: 'Fake Degree', school: 'Fake University', year: '2020' }],
    certificates: [],
    skills: [{ name: 'Fake Skill', level: 'intermediate' }],
    languages: [{ name: 'Arabic', level: 'native' }],
  },
  seniority: 'mid',
  yearsOfExperience: 2,
  skills: {
    technical: [{ name: 'Fake Skill', level: 'intermediate', yearsUsed: 2 }],
    tools: [],
    soft: [],
  },
  domains: ['fake-domain'],
  strengths: ['خبرة واضحة في المجال'],
  gaps: ['مفيش شهادات مذكورة'],
  qualityIssues: [{ type: 'no_metrics', description: 'الخبرات من غير أرقام واضحة' }],
  overallScore: 70,
  scoreReason: 'سيرة ذاتية تجريبية (fake) — للاختبار بس',
};

/** One canned, schema-valid card for the single-entry sections. */
const FAKE_CARD_BY_SECTION: Record<Exclude<SectionId, MultiEntrySection>, (userText: string) => Record<string, unknown> | unknown[]> = {
  basic: (userText) => ({ name: userText, title: null, phone: null, email: null, location: null }),
  projects: (userText) => ({ title: userText, description: 'A fake project', bullets: ['Did fake work'] }),
  skills: (userText) => [{ name: userText, level: 'intermediate' }],
  languages: (userText) => [{ name: userText, level: 'intermediate' }],
};

/** One canned entry per multi-entry section — buildExtractionReply collects these into an array from every user message in the section transcript. */
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
 * checkout works out of the box. Mirrors the two-call split
 * SectionReplyService drives: it tells the conversation call and the
 * extraction call apart by EXTRACTION_MARKER (unique to the extraction
 * prompt's system message — see ai/prompts/section-reply.prompt.ts) and
 * replies in whichever of the two shapes that call expects. Both still read
 * `current_section: <id>` out of the system prompt via a small regex, since
 * that line is common to both prompts.
 *
 * Conversation call: for `experience`/`education`/`certificates`
 * (multi-entry sections), simulates the "ask if there's another" flow —
 * `sectionDone` flips true only once a message matches CLOSE_SIGNAL. For
 * everything else, `sectionDone` is true whenever the message is longer
 * than 15 characters. The `experience` section additionally fires
 * `hasNoExperience` when the message matches NO_EXPERIENCE_SIGNAL.
 *
 * Extraction call: rebuilds the card from every user message in the section
 * transcript it's given — one entry per message for multi-entry sections,
 * or a single canned card from the last message otherwise.
 */
export class FakeLlmProvider implements LlmProvider {
  async complete(options: LlmCompletionOptions): Promise<string> {
    return JSON.stringify(this.buildReply(options));
  }

  async *stream(options: LlmCompletionOptions): AsyncIterable<string> {
    yield JSON.stringify(this.buildReply(options));
  }

  private buildReply(options: LlmCompletionOptions): Record<string, unknown> | unknown[] {
    const system = options.messages.find((message) => message.role === 'system')?.content ?? '';
    const section = (/current_section:\s*(\w+)/.exec(system)?.[1] ?? 'basic') as SectionId;

    if (system.includes(CV_ANALYSIS_MARKER)) {
      return FAKE_CV_ANALYSIS;
    }
    if (system.includes(EXTRACTION_MARKER)) {
      return this.buildExtractionReply(section, options);
    }
    return this.buildConversationReply(section, options);
  }

  private buildConversationReply(section: SectionId, options: LlmCompletionOptions): Record<string, unknown> {
    const userText = this.lastUserMessage(options);

    if (section === 'experience' && NO_EXPERIENCE_SIGNAL.test(userText)) {
      return { message: 'ولا يهمك، ده طبيعي. هنتكلم عن مشاريعك بدل كده.', sectionDone: true, hasNoExperience: true };
    }

    if (isMultiEntrySection(section)) {
      const isClosing = CLOSE_SIGNAL.test(userText);
      return isClosing
        ? { message: 'تمام خلاص، هبقى أعرضلك كل اللي جمعناه.', sectionDone: true }
        : { message: 'تمام، وفي حاجة تانية تحب تضيفها؟', sectionDone: false };
    }

    const sectionDone = userText.trim().length > 15;
    return {
      message: sectionDone
        ? 'تمام، فهمت. أعتقد جمعنا بيانات كفاية للقسم ده دلوقتي.'
        : 'تمام، ممكن تحكيلي كمان شوية عن كده؟',
      sectionDone,
    };
  }

  private buildExtractionReply(section: SectionId, options: LlmCompletionOptions): Record<string, unknown> | unknown[] {
    const userMessages = options.messages.filter((message) => message.role === 'user').map((message) => message.content);

    if (isMultiEntrySection(section)) {
      return userMessages.filter((text) => !CLOSE_SIGNAL.test(text)).map((text) => FAKE_ENTRY_BY_SECTION[section](text));
    }

    const lastText = userMessages.at(-1) ?? '';
    return FAKE_CARD_BY_SECTION[section as Exclude<SectionId, MultiEntrySection>](lastText);
  }

  private lastUserMessage(options: LlmCompletionOptions): string {
    return [...options.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
  }
}
