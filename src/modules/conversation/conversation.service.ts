import { HttpStatus, Injectable } from '@nestjs/common';
import type { SectionReply } from '../../ai/index.js';
import { generateId } from '../../common/ids.js';
import { AppError } from '../../common/errors/app-error.js';
import { RawResponseException } from '../../common/errors/raw-response.exception.js';
import { DEFAULT_BUILD_SECTIONS, SECTION_LABELS, type SectionId } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
import { CvService } from '../cv/index.js';
import { ConversationRepository } from './conversation.repository.js';
import { toMessageResponseDto, type ConversationResponseDto } from './dto/conversation-response.dto.js';
import type { CreateConversationDto } from './dto/create-conversation.dto.js';
import type { SendMessageDto } from './dto/send-message.dto.js';
import type { ConversationSession, SessionSection } from './entities/conversation-session.entity.js';
import type { Message } from './entities/message.entity.js';

export interface ActiveSessionSummary {
  activeSessionId: string | null;
  completedSections: SectionId[];
  nextSection: SectionId | null;
}

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly cvService: CvService,
  ) {}

  async create(deviceId: string, dto: CreateConversationDto): Promise<ConversationResponseDto> {
    if (dto.mode === 'upload') {
      // Temporary: the upload module doesn't exist yet. Not a contract change, just unimplemented.
      throw new AppError('INVALID_REQUEST', 'رفع الـ CV لسه مش متاح', { retryable: false });
    }

    const existing = await this.conversationRepository.findActiveByDeviceId(deviceId);
    if (existing) {
      if (!dto.restart) {
        throw new RawResponseException(HttpStatus.CONFLICT, { activeSessionId: existing.id });
      }
      await this.deleteSessionAndItsCv(existing);
    }

    const sections: SessionSection[] = DEFAULT_BUILD_SECTIONS.map((id) => ({
      id,
      label: SECTION_LABELS[id],
      status: 'pending',
    }));

    const session = await this.conversationRepository.create({
      id: generateId('cnv'),
      deviceId,
      mode: 'build',
      status: 'in_progress',
      currentSection: sections[0]?.id ?? null,
      sections,
      uploadId: null,
      cvId: null,
    });

    return this.toResponseDto(session, []);
  }

  async findByIdForDevice(sessionId: string, deviceId: string): Promise<ConversationResponseDto> {
    const session = await this.getOwnedSession(sessionId, deviceId);
    const messages = await this.conversationRepository.findMessagesBySessionId(session.id);
    return this.toResponseDto(session, messages);
  }

  async deleteByIdForDevice(sessionId: string, deviceId: string): Promise<void> {
    const session = await this.getOwnedSession(sessionId, deviceId);
    await this.deleteSessionAndItsCv(session);
  }

  async getActiveSessionSummary(deviceId: string): Promise<ActiveSessionSummary> {
    const session = await this.conversationRepository.findActiveByDeviceId(deviceId);
    if (!session) {
      return { activeSessionId: null, completedSections: [], nextSection: null };
    }
    return {
      activeSessionId: session.id,
      completedSections: session.sections.filter((section) => section.status === 'confirmed').map((section) => section.id),
      nextSection: session.currentSection,
    };
  }

  /** Only sessions still `in_progress` can be messaged. */
  async getActiveOwnedSession(sessionId: string, deviceId: string): Promise<ConversationSession> {
    const session = await this.getOwnedSession(sessionId, deviceId);
    if (session.status !== 'in_progress') {
      throw new AppError('INVALID_REQUEST', 'الجلسة دي خلصت خلاص', { retryable: false });
    }
    return session;
  }

  /** Prior text messages, oldest first, mapped for the LLM prompt — section_card messages have no natural-language text and are skipped. */
  async getMessageHistoryForPrompt(sessionId: string): Promise<LlmMessage[]> {
    const messages = await this.conversationRepository.findMessagesBySessionId(sessionId);
    return messages
      .filter((message) => message.type === 'text' && message.text)
      .map((message) => ({ role: message.role === 'ai' ? ('assistant' as const) : ('user' as const), content: message.text as string }));
  }

  appendUserMessage(session: ConversationSession, dto: SendMessageDto): Promise<Message> {
    return this.conversationRepository.createMessage({
      id: generateId('msg'),
      sessionId: session.id,
      role: 'user',
      section: session.currentSection,
      type: 'text',
      text: dto.text,
      card: null,
      quickReplies: null,
      source: dto.source,
      audioDurationSec: dto.audioDurationSec ?? null,
    });
  }

  appendAiTextMessage(session: ConversationSession, reply: SectionReply): Promise<Message> {
    return this.conversationRepository.createMessage({
      id: generateId('msg'),
      sessionId: session.id,
      role: 'ai',
      section: reply.section,
      type: 'text',
      text: reply.message,
      card: null,
      quickReplies: null,
      source: null,
      audioDurationSec: null,
    });
  }

  appendSectionCardMessage(session: ConversationSession, reply: SectionReply): Promise<Message> {
    return this.conversationRepository.createMessage({
      id: generateId('msg'),
      sessionId: session.id,
      role: 'ai',
      section: reply.section,
      type: 'section_card',
      text: null,
      card: reply.card,
      quickReplies: null,
      source: null,
      audioDurationSec: null,
    });
  }

  isLastSection(session: ConversationSession, sectionId: SectionId): boolean {
    const index = session.sections.findIndex((section) => section.id === sectionId);
    return index !== -1 && index === session.sections.length - 1;
  }

  private async getOwnedSession(sessionId: string, deviceId: string): Promise<ConversationSession> {
    const session = await this.conversationRepository.findById(sessionId);
    if (!session || session.deviceId !== deviceId) {
      throw new AppError('NOT_FOUND', 'الجلسة دي مش موجودة', { retryable: false });
    }
    return session;
  }

  /**
   * Not wrapped in a DB transaction: session.cvId can't actually be set yet
   * (nothing before the AI-powered confirm-section endpoint creates a Cv),
   * so this is a single-statement operation in practice today. Revisit once
   * that endpoint exists (see TODO.md).
   */
  private async deleteSessionAndItsCv(session: ConversationSession): Promise<void> {
    if (session.cvId) {
      await this.cvService.deleteById(session.cvId);
    }
    await this.conversationRepository.deleteById(session.id);
  }

  private toResponseDto(session: ConversationSession, messages: Message[]): ConversationResponseDto {
    return {
      sessionId: session.id,
      mode: session.mode,
      sections: session.sections,
      currentSection: session.currentSection,
      messages: messages.map(toMessageResponseDto),
      status: session.status,
    };
  }
}
