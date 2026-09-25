import { z } from 'zod';
import { type SectionConfidence, type SectionId } from '../../common/types/contract.js';
export declare const cvAnalysisCvSchema: z.ZodObject<{
    basic: z.ZodObject<{
        name: z.ZodString;
        title: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        location: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    experience: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        company: z.ZodString;
        start: z.ZodNullable<z.ZodString>;
        end: z.ZodNullable<z.ZodString>;
        bullets: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    projects: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        bullets: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    education: z.ZodArray<z.ZodObject<{
        degree: z.ZodString;
        school: z.ZodString;
        year: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    certificates: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        date: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    skills: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        level: z.ZodEnum<{
            beginner: "beginner";
            intermediate: "intermediate";
            advanced: "advanced";
            expert: "expert";
        }>;
    }, z.core.$strip>>;
    languages: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        level: z.ZodEnum<{
            beginner: "beginner";
            intermediate: "intermediate";
            advanced: "advanced";
            expert: "expert";
            native: "native";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CvAnalysisCv = z.infer<typeof cvAnalysisCvSchema>;
export declare const cvAnalysisSchema: z.ZodObject<{
    cv: z.ZodObject<{
        basic: z.ZodObject<{
            name: z.ZodString;
            title: z.ZodNullable<z.ZodString>;
            phone: z.ZodNullable<z.ZodString>;
            email: z.ZodNullable<z.ZodString>;
            location: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>;
        experience: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            company: z.ZodString;
            start: z.ZodNullable<z.ZodString>;
            end: z.ZodNullable<z.ZodString>;
            bullets: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        projects: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            description: z.ZodString;
            bullets: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        education: z.ZodArray<z.ZodObject<{
            degree: z.ZodString;
            school: z.ZodString;
            year: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        certificates: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            date: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        skills: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            level: z.ZodEnum<{
                beginner: "beginner";
                intermediate: "intermediate";
                advanced: "advanced";
                expert: "expert";
            }>;
        }, z.core.$strip>>;
        languages: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            level: z.ZodEnum<{
                beginner: "beginner";
                intermediate: "intermediate";
                advanced: "advanced";
                expert: "expert";
                native: "native";
            }>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    seniority: z.ZodEnum<{
        junior: "junior";
        mid: "mid";
        senior: "senior";
    }>;
    yearsOfExperience: z.ZodNullable<z.ZodNumber>;
    skills: z.ZodObject<{
        technical: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            level: z.ZodEnum<{
                beginner: "beginner";
                intermediate: "intermediate";
                advanced: "advanced";
                expert: "expert";
            }>;
            yearsUsed: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
        tools: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            level: z.ZodEnum<{
                beginner: "beginner";
                intermediate: "intermediate";
                advanced: "advanced";
                expert: "expert";
            }>;
            yearsUsed: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
        soft: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            level: z.ZodEnum<{
                beginner: "beginner";
                intermediate: "intermediate";
                advanced: "advanced";
                expert: "expert";
            }>;
            yearsUsed: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    domains: z.ZodArray<z.ZodString>;
    strengths: z.ZodArray<z.ZodString>;
    gaps: z.ZodArray<z.ZodString>;
    qualityIssues: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            employment_gap: "employment_gap";
            weak_bullets: "weak_bullets";
            no_metrics: "no_metrics";
            ats_formatting: "ats_formatting";
            inconsistent_dates: "inconsistent_dates";
            contact_missing: "contact_missing";
            generic_summary: "generic_summary";
            other: "other";
        }>;
        description: z.ZodString;
    }, z.core.$strip>>;
    overallScore: z.ZodNumber;
    scoreReason: z.ZodString;
}, z.core.$strip>;
export type CvAnalysisOutput = z.infer<typeof cvAnalysisSchema>;
export interface CvAnalysisResult extends CvAnalysisOutput {
    sectionConfidence: Record<SectionId, SectionConfidence>;
}
