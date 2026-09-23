import type { SectionId, SessionStatus } from '../../../common/types/contract.js';

export interface ConfirmSectionResponseDto {
  section: SectionId;
  status: 'confirmed';
  nextSection: SectionId | null;
  sessionStatus: SessionStatus;
  cvId: string | null;
}
