import { z } from 'zod';
import { type SectionId } from '../../common/types/contract.js';
export declare const basicCardSchema: z.ZodObject<{
    name: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    location: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const experienceCardSchema: z.ZodArray<z.ZodObject<{
    title: z.ZodString;
    company: z.ZodString;
    start: z.ZodNullable<z.ZodString>;
    end: z.ZodNullable<z.ZodString>;
    bullets: z.ZodArray<z.ZodString>;
}, z.core.$strip>>;
export declare const projectEntrySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    bullets: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const educationCardSchema: z.ZodArray<z.ZodObject<{
    degree: z.ZodString;
    school: z.ZodString;
    year: z.ZodNullable<z.ZodString>;
}, z.core.$strip>>;
export declare const certificatesCardSchema: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    date: z.ZodNullable<z.ZodString>;
}, z.core.$strip>>;
export declare const skillsCardSchema: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    level: z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
        expert: "expert";
    }>;
}, z.core.$strip>>;
export declare const languagesCardSchema: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    level: z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
        expert: "expert";
        native: "native";
    }>;
}, z.core.$strip>>;
export declare const CARD_SCHEMA_BY_SECTION: Record<SectionId, z.ZodType>;
export declare const conversationReplySchema: z.ZodObject<{
    message: z.ZodString;
    sectionDone: z.ZodBoolean;
    hasNoExperience: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type ConversationReply = z.infer<typeof conversationReplySchema>;
export interface SectionReply {
    message: string;
    section: SectionId;
    sectionDone: boolean;
    hasNoExperience: boolean;
    card: Record<string, unknown> | unknown[] | null;
}
