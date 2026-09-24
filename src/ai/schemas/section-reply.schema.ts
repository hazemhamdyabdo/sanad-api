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

/** Exported so other modules (e.g. validating a user's `edits` to a card before confirming a section) can reuse the exact same shape the AI's output is checked against. */
export const CARD_SCHEMA_BY_SECTION: Record<SectionId, z.ZodType> = {
  basic: basicCardSchema,
  experience: experienceCardSchema,
  projects: projectsCardSchema,
  education: educationCardSchema,
  certificates: certificatesCardSchema,
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

/**
 * `experience` gets its own variant with `hasNoExperience`: a user who's
 * never worked before has nothing to put in an experience array, and
 * forcing the model to choose between inventing a job and sending an
 * empty array (which fails the array's own min(1)) is exactly what broke
 * this path before. This gives it a third, honest option — the contract's
 * own note that `projects` replaces `experience` for exactly this case is
 * what ConversationService acts on when this fires.
 */
const experienceReplyVariant = z.object({
  message: text(),
  section: z.literal('experience'),
  sectionDone: z.boolean(),
  hasNoExperience: z.boolean().default(false),
  card: CARD_SCHEMA_BY_SECTION.experience.nullable(),
});

/** Each section's card has its own shape — kept in sync with the field list `ai/prompts/section-reply.prompt.ts` puts in the system message. */
const sectionReplyUnion = z.discriminatedUnion('section', [
  sectionVariant('basic', CARD_SCHEMA_BY_SECTION.basic),
  experienceReplyVariant,
  sectionVariant('projects', CARD_SCHEMA_BY_SECTION.projects),
  sectionVariant('education', CARD_SCHEMA_BY_SECTION.education),
  sectionVariant('certificates', CARD_SCHEMA_BY_SECTION.certificates),
  sectionVariant('skills', CARD_SCHEMA_BY_SECTION.skills),
  sectionVariant('languages', CARD_SCHEMA_BY_SECTION.languages),
]);

/**
 * A `card` is only ever meaningful when `sectionDone` is true — nothing
 * renders or persists it otherwise. A card sent alongside `sectionDone:
 * false` is dropped by SectionReplyService, not rejected here: failing the
 * whole reply (and costing the user their turn) over a field nobody reads
 * isn't worth it. What's actually fatal is a `sectionDone: true` with
 * nothing to show for it — except `experience` + `hasNoExperience`, where
 * "nothing to show" is the whole point.
 */
export const sectionReplySchema = sectionReplyUnion.superRefine((data, ctx) => {
  const skipsCard = data.section === 'experience' && data.hasNoExperience;
  if (data.sectionDone && data.card === null && !skipsCard) {
    ctx.addIssue({ code: 'custom', message: 'card is required when sectionDone is true', path: ['card'] });
  }
});

export type SectionReply = z.infer<typeof sectionReplyUnion>;
