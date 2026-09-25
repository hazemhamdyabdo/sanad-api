import type { SectionId, SessionStatus } from '../../../common/types/contract.js';
import type { MessageResponseDto } from './conversation-response.dto.js';
export interface ConfirmSectionResponseDto {
    section: SectionId;
    status: 'confirmed';
    nextSection: SectionId | null;
    sessionStatus: SessionStatus;
    cvId: string | null;
    nextMessage: MessageResponseDto;
}
