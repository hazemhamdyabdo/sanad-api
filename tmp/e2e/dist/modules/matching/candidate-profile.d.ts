import type { MatchCandidate } from '../../ai/index.js';
import type { CvAnalysisResponseDto } from '../cv/index.js';
import { type RoleDefinition } from '../jobs/index.js';
export interface CvForMatching {
    name: string | null;
    title: string | null;
    experience: unknown[];
    projects: unknown[];
    education: unknown[];
    certificates: unknown[];
    skills: unknown[];
    languages: unknown[];
}
export declare function buildMatchCandidate(cv: CvForMatching | null, analysis: CvAnalysisResponseDto | null): MatchCandidate | null;
export declare function buildCandidateEmbeddingText(candidate: MatchCandidate, targetRole: RoleDefinition | null): string;
export declare function hashCandidate(candidate: MatchCandidate, promptVersion: string): string;
