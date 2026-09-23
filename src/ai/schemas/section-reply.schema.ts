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

const experienceCardSchema = z.object({
  title: text(),
  company: text(),
  start: text(),
  end: text().nullable(),
  bullets: z.array(text()).min(1),
});

const projectsCardSchema = z.object({
  title: text(),
  description: text(),
  bullets: z.array(text()).min(1),
});

const educationCardSchema = z.object({
  degree: text(),
  school: text(),
  year: text(),
});

const certificateCardSchema = z.object({
  name: text(),
  date: text().nullable(),
});

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

/** Exported so other modules (e.g. validating a user's `edits` to a card before confirming a section) can reuse the exact same shape the AI's output is checked against. */
export const CARD_SCHEMA_BY_SECTION: Record<SectionId, z.ZodType> = {
  basic: basicCardSchema,
  experience: experienceCardSchema,
  projects: projectsCardSchema,
  education: educationCardSchema,
  certificates: certificateCardSchema,
  skills: skillsCardSchema,
  languages: languagesCardSchema,
};

function sectionVariant<Id extends SectionId>(id: Id, cardSchema: z.ZodType) {
  return z.object({
    message: text(),
    section: z.literal(id),
    sectionDone: z.boolean(),
    card: cardSchema.nullable(),
  });
}

/** Each section's card has its own shape — kept in sync with the field list `ai/prompts/section-reply.prompt.ts` puts in the system message. */
const sectionReplyUnion = z.discriminatedUnion('section', [
  sectionVariant('basic', CARD_SCHEMA_BY_SECTION.basic),
  sectionVariant('experience', CARD_SCHEMA_BY_SECTION.experience),
  sectionVariant('projects', CARD_SCHEMA_BY_SECTION.projects),
  sectionVariant('education', CARD_SCHEMA_BY_SECTION.education),
  sectionVariant('certificates', CARD_SCHEMA_BY_SECTION.certificates),
  sectionVariant('skills', CARD_SCHEMA_BY_SECTION.skills),
  sectionVariant('languages', CARD_SCHEMA_BY_SECTION.languages),
]);

/**
 * `sectionDone` and `card` must agree: no card while still collecting
 * answers, and never a `sectionDone: true` with nothing to show for it —
 * this is what actually enforces "never a half-built card" at the schema
 * level, on top of each section's own required fields above.
 */
export const sectionReplySchema = sectionReplyUnion.superRefine((data, ctx) => {
  if (data.sectionDone && data.card === null) {
    ctx.addIssue({ code: 'custom', message: 'card is required when sectionDone is true', path: ['card'] });
  }
  if (!data.sectionDone && data.card !== null) {
    ctx.addIssue({ code: 'custom', message: 'card must be null when sectionDone is false', path: ['card'] });
  }
});

export type SectionReply = z.infer<typeof sectionReplyUnion>;
