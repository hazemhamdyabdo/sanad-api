import type { CvAnalysisCv } from '../../../ai/schemas/cv-analysis.schema.js';
import type { QualityIssueType, SectionConfidence, SectionId, Seniority } from '../../../common/types/contract.js';
import type { CvAnalysis, CvAnalysisSkills } from '../entities/cv-analysis.entity.js';

/** The `analysis` object embedded in `GET /cv/uploads/:uploadId` once `status: "done"` — see API-CONTRACT.md §4. */
export interface CvAnalysisResponseDto {
  cv: CvAnalysisCv;
  sectionConfidence: Record<SectionId, SectionConfidence>;
  seniority: Seniority;
  yearsOfExperience: number | null;
  skills: CvAnalysisSkills;
  domains: string[];
  strengths: string[];
  gaps: string[];
  qualityIssues: Array<{ type: QualityIssueType; description: string }>;
  overallScore: number;
  scoreReason: string;
}

export function toCvAnalysisResponseDto(analysis: CvAnalysis): CvAnalysisResponseDto {
  return {
    cv: analysis.cv,
    sectionConfidence: analysis.sectionConfidence,
    seniority: analysis.seniority,
    yearsOfExperience: analysis.yearsOfExperience,
    skills: analysis.skills,
    domains: analysis.domains,
    strengths: analysis.strengths,
    gaps: analysis.gaps,
    qualityIssues: analysis.qualityIssues,
    overallScore: analysis.overallScore,
    scoreReason: analysis.scoreReason,
  };
}
