import { z } from 'zod';
import { LEVELS, QUALITY_ISSUE_TYPES, SENIORITY_LEVELS } from '../../common/types/contract.js';
import { basicCardSchema, certificatesCardSchema, educationCardSchema, experienceCardSchema, languagesCardSchema, projectEntrySchema, skillsCardSchema, } from './section-reply.schema.js';
const text = () => z.string().trim().min(1);
const SKILL_LEVELS = LEVELS.filter((level) => level !== 'native');
const skillWithYearsSchema = z.object({
    name: text(),
    level: z.enum(SKILL_LEVELS),
    yearsUsed: z.number().min(0).max(60).nullable(),
});
export const cvAnalysisCvSchema = z.object({
    basic: basicCardSchema,
    experience: experienceCardSchema,
    projects: z.array(projectEntrySchema),
    education: educationCardSchema,
    certificates: certificatesCardSchema,
    skills: skillsCardSchema,
    languages: languagesCardSchema,
});
export const cvAnalysisSchema = z.object({
    cv: cvAnalysisCvSchema,
    seniority: z.enum(SENIORITY_LEVELS),
    yearsOfExperience: z.number().min(0).max(60).nullable(),
    skills: z.object({
        technical: z.array(skillWithYearsSchema),
        tools: z.array(skillWithYearsSchema),
        soft: z.array(skillWithYearsSchema),
    }),
    domains: z.array(text()),
    strengths: z.array(text()),
    gaps: z.array(text()),
    qualityIssues: z
        .array(z.object({
        type: z.enum(QUALITY_ISSUE_TYPES),
        description: text(),
    }))
        .transform((issues) => issues.filter((issue) => !/&(amp|lt|gt|quot|apos|nbsp|#\d+);/i.test(issue.description))),
    overallScore: z.number().int().min(0).max(100),
    scoreReason: text(),
});
//# sourceMappingURL=cv-analysis.schema.js.map