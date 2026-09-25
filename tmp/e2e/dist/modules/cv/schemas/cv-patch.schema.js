import { z } from 'zod';
import { CARD_SCHEMA_BY_SECTION } from '../../../ai/index.js';
const text = () => z.string().trim().min(1);
const contactSchema = z.object({
    phone: text().nullable().optional(),
    email: text().nullable().optional(),
    location: text().nullable().optional(),
});
const projectsArraySchema = z.array(z.object({
    title: text(),
    description: text(),
    bullets: z.array(text()).min(1),
}));
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
//# sourceMappingURL=cv-patch.schema.js.map