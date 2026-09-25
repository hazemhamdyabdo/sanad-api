import { DataSource } from 'typeorm';
import { type SectionReply } from '../../ai/index.js';
import { type SectionId } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
import { CvService } from '../cv/index.js';
import { UploadService } from '../upload/index.js';
import { ConversationRepository } from './conversation.repository.js';
import type { ConfirmSectionDto } from './dto/confirm-section.dto.js';
import type { ConfirmSectionResponseDto } from './dto/confirm-section-response.dto.js';
import { type ConversationResponseDto } from './dto/conversation-response.dto.js';
import type { CreateConversationDto } from './dto/create-conversation.dto.js';
import type { SendMessageDto } from './dto/send-message.dto.js';
import type { ConversationSession } from './entities/conversation-session.entity.js';
import type { Message } from './entities/message.entity.js';
export interface ActiveSessionSummary {
    activeSessionId: string | null;
    completedSections: SectionId[];
    nextSection: SectionId | null;
}
export declare class ConversationService {
    private readonly conversationRepository;
    private readonly cvService;
    private readonly uploadService;
    private readonly dataSource;
    constructor(conversationRepository: ConversationRepository, cvService: CvService, uploadService: UploadService, dataSource: DataSource);
    create(deviceId: string, dto: CreateConversationDto): Promise<ConversationResponseDto>;
    findByIdForDevice(sessionId: string, deviceId: string): Promise<ConversationResponseDto>;
    deleteByIdForDevice(sessionId: string, deviceId: string): Promise<void>;
    getActiveSessionSummary(deviceId: string): Promise<ActiveSessionSummary>;
    getActiveOwnedSession(sessionId: string, deviceId: string): Promise<ConversationSession>;
    getMessageHistoryForPrompt(sessionId: string, section: SectionId): Promise<LlmMessage[]>;
    getBestPriorSectionCard(sessionId: string, section: SectionId): Promise<Record<string, unknown> | unknown[] | null>;
    getSectionCardsForDevice(sessionId: string, deviceId: string): Promise<Array<Record<string, unknown> | unknown[]>>;
    appendUserMessage(session: ConversationSession, dto: SendMessageDto): Promise<Message>;
    appendAiTextMessage(session: ConversationSession, reply: SectionReply): Promise<Message>;
    appendSectionCardMessage(session: ConversationSession, reply: SectionReply): Promise<Message>;
    switchExperienceToProjects(session: ConversationSession): Promise<void>;
    isLastSection(session: ConversationSession, sectionId: SectionId): boolean;
    confirmSection(sessionId: string, deviceId: string, sectionId: SectionId, dto: ConfirmSectionDto): Promise<ConfirmSectionResponseDto>;
    private resolveSectionContent;
    private getOwnedSession;
    private deleteSessionAndItsCv;
    private toResponseDto;
}
