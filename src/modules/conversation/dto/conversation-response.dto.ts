import type { MessageRole, MessageSource, MessageType, SectionId, SessionMode, SessionStatus } from '../../../common/types/contract.js';
import type { SessionSection } from '../entities/conversation-session.entity.js';

export interface MessageResponseDto {
  id: string;
  role: MessageRole;
  section: SectionId | null;
  type: MessageType;
  text: string | null;
  card?: Record<string, unknown> | null;
  quickReplies?: string[] | null;
  source?: MessageSource | null;
  audioDurationSec?: number | null;
  createdAt: string;
}

export interface ConversationResponseDto {
  sessionId: string;
  mode: SessionMode;
  sections: SessionSection[];
  currentSection: SectionId | null;
  messages: MessageResponseDto[];
  status: SessionStatus;
}
