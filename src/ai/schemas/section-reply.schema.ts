import { z } from 'zod';
import { LEVELS, type SectionId } from '../../common/types/contract.js';

const text = () => z.string().trim().min(1);

const basicCardSchema = z.object({
  name: text(),
  title: text().nullable(),
  phone: text().nullable(),
  email: text().nullable(),
  location: text().nullable(),
});

/**
 * A user usually has more than one job — an array so a second (or third)
 * entry doesn't get dropped. No `.min(1)`: the genuinely-empty case is
 * meant to go through the `hasNoExperience` pivot instead of reaching
 * extraction at all, but if it slips through anyway, an empty array is a
 * far better outcome than hard-failing the user's turn over it.
 */
const experienceCardSchema = z.array(
  z.object({
    title: text(),
    company: text(),
    start: text(),
    end: text().nullable(),
    bullets: z.array(text()).min(1),
  }),
);

const projectsCardSchema = z.object({
  title: text(),
  description: text(),
  bullets: z.array(text()).min(1),
});

/**
 * A user usually has more than one degree/diploma — an array, same reasoning
 * as experience. Unlike experience, there's no dedicated pivot for "no
 * education at all", so an empty array has to be a valid result here: a
 * user who's entirely self-taught genuinely has zero entries to report, and
 * that's a legitimate answer, not a defect to reject.
 */
const educationCardSchema = z.array(
  z.object({
    degree: text(),
    school: text(),
    year: text(),
  }),
);

/** A user usually has more than one certificate, but plenty of people genuinely have none — an empty array is a legitimate, honest answer, not a defect. */
const certificatesCardSchema = z.array(
  z.object({
    name: text(),
    date: text().nullable(),
  }),
);

/** Unlike languages, a skill level is never "native". */
const SKILL_LEVELS = LEVELS.filter((level) => level !== 'native') as Exclude<(typeof LEVELS)[number], 'native'>[];

/** A user typically names several skills/languages in one answer — an array so the model isn't forced to drop all but one. An empty array is still valid: rare, but not worth hard-failing a whole conversation over. */
const skillsCardSchema = z.array(
  z.object({
    name: text(),
    level: z.enum(SKILL_LEVELS),
  }),
);

const languagesCardSchema = z.array(
  z.object({
    name: text(),
    level: z.enum(LEVELS),
  }),
);

/** Exported so other modules (e.g. validating a user's `edits` to a card before confirming a section, and SectionReplyService's extraction-call validation) can reuse the exact same shape. */
export const CARD_SCHEMA_BY_SECTION: Record<SectionId, z.ZodType> = {
  basic: basicCardSchema,
  experience: experienceCardSchema,
  projects: projectsCardSchema,
  education: educationCardSchema,
  certificates: certificatesCardSchema,
  skills: skillsCardSchema,
  languages: languagesCardSchema,
};

/**
 * The conversation call's output — deliberately minimal. A single prompt
 * that has to hold a natural conversation AND extract structured per-section
 * data at the same time overloads a small model: that combination is what
 * caused a raw user message to get dumped straight into the `name` field
 * instead of being parsed. Splitting into this short conversation call and a
 * separate extraction call (run only once `sectionDone` fires, validated
 * against CARD_SCHEMA_BY_SECTION) keeps each prompt short enough to follow
 * reliably, and makes extraction deterministic instead of competing with the
 * conversation for the model's attention.
 */
export const conversationReplySchema = z.object({
  message: text(),
  sectionDone: z.boolean(),
  /** Only meaningful for `experience` — always false for every other section. */
  hasNoExperience: z.boolean().default(false),
});

export type ConversationReply = z.infer<typeof conversationReplySchema>;

/** The final, consumer-facing shape SectionReplyService returns after combining both calls. */
export interface SectionReply {
  message: string;
  section: SectionId;
  sectionDone: boolean;
  hasNoExperience: boolean;
  card: Record<string, unknown> | unknown[] | null;
}
