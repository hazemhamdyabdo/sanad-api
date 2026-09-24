import { z } from 'zod';
import { CARD_SCHEMA_BY_SECTION } from '../../../ai/index.js';

const text = () => z.string().trim().min(1);

const contactSchema = z.object({
  phone: text().nullable().optional(),
  email: text().nullable().optional(),
  location: text().nullable().optional(),
});

/**
 * `CARD_SCHEMA_BY_SECTION.projects` is a single object — the conversation's own extraction call only
 * ever fills in one project per confirm (see `ai/schemas/section-reply.schema.ts`). The CV response
 * always shows `projects` as an array, so `PATCH /cv` (which replaces the whole array from the
 * review screen) validates a plain array of that same per-item shape instead of reusing the card
 * schema directly.
 */
const projectsArraySchema = z.array(
  z.object({
    title: text(),
    description: text(),
    bullets: z.array(text()).min(1),
  }),
);

/** Every field is optional — `PATCH /cv` only sends the fields being changed. */
export const cvPatchSchema = z.object({
  name: text().optional(),
  title: text().nullable().optional(),
  contact: contactSchema.optional(),
  summary: text().nullable().optional(),
  experience: CARD_SCHEMA_BY_SECTION.experience.optional(),
  projects: projectsArraySchema.optional(),
  education: CARD_SCHEMA_BY_SECTION.education.optional(),
  certificates: CARD_SCHEMA_BY_SECTION.certificates.optional(),
  skills: CARD_SCHEMA_BY_SECTION.skills.optional(),
  languages: CARD_SCHEMA_BY_SECTION.languages.optional(),
});

export type CvPatch = z.infer<typeof cvPatchSchema>;
