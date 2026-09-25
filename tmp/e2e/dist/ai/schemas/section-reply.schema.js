import { z } from 'zod';
import { LEVELS } from '../../common/types/contract.js';
const text = () => z.string().trim().min(1);
export const basicCardSchema = z.object({
    name: text(),
    title: text().nullable(),
    phone: text().nullable(),
    email: text().nullable(),
    location: text().nullable(),
});
export const experienceCardSchema = z.array(z.object({
    title: text(),
    company: text(),
    start: text().nullable(),
    end: text().nullable(),
    bullets: z.array(text()).min(1),
}));
export const projectEntrySchema = z.object({
    title: text(),
    description: text(),
    bullets: z.array(text()).min(1),
});
const projectsCardSchema = projectEntrySchema;
export const educationCardSchema = z.array(z.object({
    degree: text(),
    school: text(),
    year: text().nullable(),
}));
export const certificatesCardSchema = z.array(z.object({
    name: text(),
    date: text().nullable(),
}));
const SKILL_LEVELS = LEVELS.filter((level) => level !== 'native');
export const skillsCardSchema = z.array(z.object({
    name: text(),
    level: z.enum(SKILL_LEVELS),
}));
export const languagesCardSchema = z.array(z.object({
    name: text(),
    level: z.enum(LEVELS),
}));
export const CARD_SCHEMA_BY_SECTION = {
    basic: basicCardSchema,
    experience: experienceCardSchema,
    projects: projectsCardSchema,
    education: educationCardSchema,
    certificates: certificatesCardSchema,
    skills: skillsCardSchema,
    languages: languagesCardSchema,
};
export const conversationReplySchema = z.object({
    message: text(),
    sectionDone: z.boolean(),
    hasNoExperience: z.boolean().default(false),
});
//# sourceMappingURL=section-reply.schema.js.map