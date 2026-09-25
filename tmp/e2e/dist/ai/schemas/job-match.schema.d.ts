import { z } from 'zod';
export interface MatchCandidate {
    title: string | null;
    pastTitles: string[];
    highlights: string[];
    seniority: 'junior' | 'mid' | 'senior' | null;
    yearsOfExperience: number | null;
    skills: string[];
    domains: string[];
    education: string[];
    certificates: string[];
    languages: string[];
}
export interface MatchJob {
    id: string;
    title: string;
    company: string | null;
    description: string;
}
export interface JobMatchExplanation {
    jobId: string;
    match: number;
    whyMatch: string[];
    gaps: string[];
}
export declare const jobMatchEnvelopeSchema: z.ZodObject<{
    matches: z.ZodArray<z.ZodUnknown>;
}, z.core.$strip>;
export declare const jobMatchItemSchema: z.ZodObject<{
    jobId: z.ZodString;
    match: z.ZodPipe<z.ZodCoercedNumber<unknown>, z.ZodTransform<number, number>>;
    whyMatch: z.ZodPipe<z.ZodPreprocess<z.ZodArray<z.ZodString>, unknown>, z.ZodTransform<string[], string[]>>;
    gaps: z.ZodPipe<z.ZodPreprocess<z.ZodArray<z.ZodString>, unknown>, z.ZodTransform<string[], string[]>>;
}, z.core.$strip>;
