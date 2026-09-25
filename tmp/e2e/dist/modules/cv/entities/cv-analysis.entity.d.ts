import type { CvAnalysisCv } from '../../../ai/schemas/cv-analysis.schema.js';
import type { QualityIssueType, SectionConfidence, SectionId, Seniority } from '../../../common/types/contract.js';
export interface CvAnalysisSkillEntry {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsUsed: number | null;
}
export interface CvAnalysisSkills {
    technical: CvAnalysisSkillEntry[];
    tools: CvAnalysisSkillEntry[];
    soft: CvAnalysisSkillEntry[];
}
export interface CvAnalysisQualityIssue {
    type: QualityIssueType;
    description: string;
}
export declare class CvAnalysis {
    id: string;
    deviceId: string;
    uploadId: string | null;
    cv: CvAnalysisCv;
    sectionConfidence: Record<SectionId, SectionConfidence>;
    seniority: Seniority;
    yearsOfExperience: number | null;
    skills: CvAnalysisSkills;
    domains: string[];
    strengths: string[];
    gaps: string[];
    qualityIssues: CvAnalysisQualityIssue[];
    overallScore: number;
    scoreReason: string;
    createdAt: Date;
    updatedAt: Date;
}
