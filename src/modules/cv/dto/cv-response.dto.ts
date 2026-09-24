import type { SectionId } from '../../../common/types/contract.js';
import type { Cv, CvContact } from '../entities/cv.entity.js';
import type { CvSection } from '../entities/cv-section.entity.js';

/** The array-shaped sections in the contract's CV response — always present, `[]` when there's nothing yet. */
const ARRAY_SECTIONS = ['experience', 'projects', 'education', 'certificates', 'skills', 'languages'] as const satisfies readonly SectionId[];
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

/**
 * Builds the contract's CV shape from the `cv` row (which carries the flat `basic`-derived fields)
 * and whatever `CvSection` rows exist. A section with no row yet returns `[]`, never `null`, per
 * the contract.
 *
 * `projects` is the one section where the conversation's own card is a single object (see
 * `ai/schemas/section-reply.schema.ts` — arrayifying it is a separate, not-yet-done change), while
 * the CV response always shows an array. A lone object confirmed through the normal conversation
 * flow is wrapped as a one-item array here; content written through `PATCH /cv` is already an array
 * (see `cvPatchSchema`) and passes through unchanged.
 */
export function toCvResponseDto(cv: Cv, sections: CvSection[]): CvResponseDto {
  const contentBySection = new Map(sections.map((section) => [section.section, section.content]));

  const arrayFor = (id: SectionId): unknown[] => {
    const content = contentBySection.get(id);
    if (content === undefined) {
      return [];
    }
    return Array.isArray(content) ? content : [content];
  };

  return {
    cvId: cv.id,
    isComplete: cv.isComplete,
    updatedAt: cv.updatedAt.toISOString(),
    confirmedSections: cv.confirmedSections,
    name: cv.name,
    title: cv.title,
    contact: cv.contact,
    summary: cv.summary,
    experience: arrayFor('experience'),
    projects: arrayFor('projects'),
    education: arrayFor('education'),
    certificates: arrayFor('certificates'),
    skills: arrayFor('skills'),
    languages: arrayFor('languages'),
  };
}

export { ARRAY_SECTIONS };
