import type { SectionId } from '../../../common/types/contract.js';
export interface CvContact {
    phone?: string;
    email?: string;
    location?: string;
}
export declare class Cv {
    id: string;
    deviceId: string;
    isComplete: boolean;
    confirmedSections: SectionId[];
    name: string | null;
    title: string | null;
    contact: CvContact | null;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date;
}
