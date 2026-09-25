import type { Seniority } from '../../common/types/contract.js';
import { type RoleGroupId } from './roles.js';
export interface EmbeddingTextParts {
    titles: string[];
    seniority: Seniority | null;
    skills: string[];
    domains: string[];
    details?: string;
}
export declare function groupLabel(group: RoleGroupId): string;
export declare function buildEmbeddingText(parts: EmbeddingTextParts): string;
export declare function buildJobEmbeddingText(job: {
    title: string;
    role: string;
    group: RoleGroupId;
    snippet: string | null;
}): string;
