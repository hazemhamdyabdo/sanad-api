import type { Response } from 'express';
import { SectionReplyService } from '../../ai/index.js';
import type { Device } from '../device/index.js';
import { ConversationService } from './conversation.service.js';
import { ConfirmSectionDto } from './dto/confirm-section.dto.js';
import type { ConfirmSectionResponseDto } from './dto/confirm-section-response.dto.js';
import { type ConversationResponseDto } from './dto/conversation-response.dto.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
export declare class ConversationController {
    private readonly conversationService;
    private readonly sectionReplyService;
    private readonly logger;
    constructor(conversationService: ConversationService, sectionReplyService: SectionReplyService);
    create(device: Device, dto: CreateConversationDto): Promise<ConversationResponseDto>;
    findOne(device: Device, sessionId: string): Promise<ConversationResponseDto>;
    remove(device: Device, sessionId: string): Promise<void>;
    confirmSection(device: Device, sessionId: string, sectionId: string, dto: ConfirmSectionDto): Promise<ConfirmSectionResponseDto>;
    sendMessage(device: Device, sessionId: string, dto: SendMessageDto, res: Response): Promise<void>;
    private streamTextMessage;
}
