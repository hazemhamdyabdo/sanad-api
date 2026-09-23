import type { MessageRole, MessageSource, MessageType, SectionId, SessionMode, SessionStatus } from '../../../common/types/contract.js';
import type { SessionSection } from '../entities/conversation-session.entity.js';
import type { Message } from '../entities/message.entity.js';

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

/** Shared by GET /conversations/:id's messages array and the SSE user_message/message_start events — same shape either way. */
export function toMessageResponseDto(message: Message): MessageResponseDto {
  return {
    id: message.id,
    role: message.role,
    section: message.section,
    type: message.type,
    text: message.text,
    card: message.card,
    quickReplies: message.quickReplies,
    source: message.source,
    audioDurationSec: message.audioDurationSec,
    createdAt: message.createdAt.toISOString(),
  };
}
