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
  sectionVariant('basic', basicCardSchema),
  sectionVariant('experience', experienceCardSchema),
  sectionVariant('projects', projectsCardSchema),
  sectionVariant('education', educationCardSchema),
  sectionVariant('certificates', certificateCardSchema),
  sectionVariant('skills', skillsCardSchema),
  sectionVariant('languages', languagesCardSchema),
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
