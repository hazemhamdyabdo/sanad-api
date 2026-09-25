import type { SectionId } from '../../../common/types/contract.js';
import type { Cv, CvContact } from '../entities/cv.entity.js';
import type { CvSection } from '../entities/cv-section.entity.js';
declare const ARRAY_SECTIONS: readonly ["experience", "projects", "education", "certificates", "skills", "languages"];
export type ArraySectionId = (typeof ARRAY_SECTIONS)[number];
export interface CvResponseDto {
    cvId: string;
    isComplete: boolean;
    updatedAt: string;
    confirmedSections: SectionId[];
    name: string | null;
    title: string | null;
    contact: CvContact | null;
    summary: string | null;
    experience: unknown[];
    projects: unknown[];
    education: unknown[];
    certificates: unknown[];
    skills: unknown[];
    languages: unknown[];
}
export declare function toCvResponseDto(cv: Cv, sections: CvSection[]): CvResponseDto;
export { ARRAY_SECTIONS };
