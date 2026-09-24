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

/** A user usually has more than one job — an array so a second (or third) entry doesn't get dropped. */
const experienceCardSchema = z
  .array(
    z.object({
      title: text(),
      company: text(),
      start: text(),
      end: text().nullable(),
      bullets: z.array(text()).min(1),
    }),
  )
  .min(1);

const projectsCardSchema = z.object({
  title: text(),
  description: text(),
  bullets: z.array(text()).min(1),
});

/** A user usually has more than one degree/diploma — an array, same reasoning as experience. */
const educationCardSchema = z
  .array(
    z.object({
      degree: text(),
      school: text(),
      year: text(),
    }),
  )
  .min(1);

/** A user usually has more than one certificate — an array, same reasoning as experience. */
const certificatesCardSchema = z
  .array(
    z.object({
      name: text(),
      date: text().nullable(),
    }),
  )
  .min(1);

/** Unlike languages, a skill level is never "native". */
const SKILL_LEVELS = LEVELS.filter((level) => level !== 'native') as Exclude<(typeof LEVELS)[number], 'native'>[];

/** A user typically names several skills/languages in one answer — an array so the model isn't forced to drop all but one. */
const skillsCardSchema = z
  .array(
    z.object({
      name: text(),
      level: z.enum(SKILL_LEVELS),
    }),
  )
  .min(1);

const languagesCardSchema = z
  .array(
    z.object({
      name: text(),
      level: z.enum(LEVELS),
    }),
  )
  .min(1);

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
