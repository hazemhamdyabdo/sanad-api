import { type SessionMode } from '../../../common/types/contract.js';
export declare class CreateConversationDto {
    mode: SessionMode;
    uploadId?: string | null;
    restart?: boolean;
}
