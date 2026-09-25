import type { SectionId } from '../../../common/types/contract.js';
export declare class CvSection {
    id: string;
    cvId: string;
    section: SectionId;
    content: unknown;
    confirmedAt: Date;
}
