import type { CvAnalysisCv } from '../../../ai/schemas/cv-analysis.schema.js';
import type { QualityIssueType, SectionConfidence, SectionId, Seniority } from '../../../common/types/contract.js';
import type { CvAnalysis, CvAnalysisSkills } from '../entities/cv-analysis.entity.js';
export interface CvAnalysisResponseDto {
    cv: CvAnalysisCv;
    sectionConfidence: Record<SectionId, SectionConfidence>;
    seniority: Seniority;
    yearsOfExperience: number | null;
    skills: CvAnalysisSkills;
    domains: string[];
    strengths: string[];
    gaps: string[];
    qualityIssues: Array<{
        type: QualityIssueType;
        description: string;
    }>;
    overallScore: number;
    scoreReason: string;
}
export declare function toCvAnalysisResponseDto(analysis: CvAnalysis): CvAnalysisResponseDto;
