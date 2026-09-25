import type { SectionId, SectionStatus, SessionMode, SessionStatus } from '../../../common/types/contract.js';
export interface SessionSection {
    id: SectionId;
    label: string;
    status: SectionStatus;
}
export declare class ConversationSession {
    id: string;
    deviceId: string;
    mode: SessionMode;
    status: SessionStatus;
    currentSection: SectionId | null;
    sections: SessionSection[];
    uploadId: string | null;
    cvId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
