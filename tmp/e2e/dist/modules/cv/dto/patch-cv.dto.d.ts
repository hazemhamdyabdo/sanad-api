import type { CvContact } from '../entities/cv.entity.js';
export declare class PatchCvDto {
    name?: string;
    title?: string | null;
    contact?: CvContact;
    summary?: string | null;
    experience?: unknown[];
    projects?: unknown[];
    education?: unknown[];
    certificates?: unknown[];
    skills?: unknown[];
    languages?: unknown[];
}
