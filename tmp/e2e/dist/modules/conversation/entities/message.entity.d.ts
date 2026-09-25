import type { MessageRole, MessageSource, MessageType, SectionId } from '../../../common/types/contract.js';
export declare class Message {
    id: string;
    sessionId: string;
    role: MessageRole;
    section: SectionId | null;
    type: MessageType;
    text: string | null;
    card: Record<string, unknown> | unknown[] | null;
    quickReplies: string[] | null;
    source: MessageSource | null;
    audioDurationSec: number | null;
    sequence: number;
    createdAt: Date;
}
