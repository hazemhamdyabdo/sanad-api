import { z } from 'zod';
export interface TailorCvInput {
    title: string | null;
    experience: Array<{
        title: string;
        company: string;
        bullets: string[];
    }>;
    projects: Array<{
        title: string;
        description: string;
        bullets: string[];
    }>;
    skills: string[];
}
export interface TailorJobInput {
    title: string;
    company: string | null;
    description: string;
}
export interface TailoredCvContent {
    experienceBullets: string[][];
    projectBullets: string[][];
    skillOrder: string[];
    tailored: boolean;
}
export declare const cvTailorOutputSchema: z.ZodObject<{
    experience: z.ZodDefault<z.ZodArray<z.ZodObject<{
        index: z.ZodCoercedNumber<unknown>;
        bullets: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
    projects: z.ZodDefault<z.ZodArray<z.ZodObject<{
        index: z.ZodCoercedNumber<unknown>;
        bullets: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
    skillOrder: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
