import type { SectionId, SessionStatus } from '../../../common/types/contract.js';
import type { MessageResponseDto } from './conversation-response.dto.js';

export interface ConfirmSectionResponseDto {
  section: SectionId;
  status: 'confirmed';
  nextSection: SectionId | null;
  sessionStatus: SessionStatus;
  cvId: string | null;
  /**
   * The opening message for `nextSection`, already persisted on the session (so it also comes back
   * from `GET /conversations/:id`) — lets the client render it immediately instead of the chat going
   * silent after confirm. When `nextSection` is null (the CV just closed), this is the closing
   * message instead, with `section: null`.
   */
  nextMessage: MessageResponseDto;
}
