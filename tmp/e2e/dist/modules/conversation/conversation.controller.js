var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ConversationController_1;
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Res } from '@nestjs/common';
import { SectionReplyService } from '../../ai/index.js';
import { delay } from '../../common/delay.js';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { AppError } from '../../common/errors/app-error.js';
import { toErrorBody } from '../../common/errors/to-error-body.js';
import { SseWriter } from '../../common/sse/sse-writer.js';
import { tokenize } from '../../common/sse/tokenize.js';
import { SECTION_CARD_ACTIONS } from '../../common/types/contract.js';
import { ConversationService } from './conversation.service.js';
import { ConfirmSectionDto } from './dto/confirm-section.dto.js';
import { toMessageResponseDto } from './dto/conversation-response.dto.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
const TOKEN_DELAY_MS = 30;
let ConversationController = ConversationController_1 = class ConversationController {
    conversationService;
    sectionReplyService;
    logger = new Logger(ConversationController_1.name);
    constructor(conversationService, sectionReplyService) {
        this.conversationService = conversationService;
        this.sectionReplyService = sectionReplyService;
    }
    create(device, dto) {
        return this.conversationService.create(device.id, dto);
    }
    findOne(device, sessionId) {
        return this.conversationService.findByIdForDevice(sessionId, device.id);
    }
    remove(device, sessionId) {
        return this.conversationService.deleteByIdForDevice(sessionId, device.id);
    }
    confirmSection(device, sessionId, sectionId, dto) {
        return this.conversationService.confirmSection(sessionId, device.id, sectionId, dto);
    }
    async sendMessage(device, sessionId, dto, res) {
        const session = await this.conversationService.getActiveOwnedSession(sessionId, device.id);
        const section = session.currentSection ?? 'basic';
        const history = await this.conversationService.getMessageHistoryForPrompt(session.id, section);
        const previousBestCard = await this.conversationService.getBestPriorSectionCard(session.id, section);
        const userMessage = await this.conversationService.appendUserMessage(session, dto);
        const sse = new SseWriter(res);
        sse.startHeartbeat();
        sse.send('user_message', toMessageResponseDto(userMessage));
        try {
            const reply = await this.sectionReplyService.generate(section, history, dto.text, previousBestCard);
            const aiMessage = await this.conversationService.appendAiTextMessage(session, reply);
            await this.streamTextMessage(sse, aiMessage);
            if (reply.section === 'experience' && reply.hasNoExperience) {
                await this.conversationService.switchExperienceToProjects(session);
            }
            else if (reply.sectionDone && reply.card) {
                const cardMessage = await this.conversationService.appendSectionCardMessage(session, reply);
                sse.send('section_card', {
                    id: cardMessage.id,
                    section: cardMessage.section,
                    isLast: this.conversationService.isLastSection(session, reply.section),
                    card: reply.card,
                    actions: SECTION_CARD_ACTIONS,
                });
            }
            sse.send('done', { currentSection: session.currentSection, status: session.status });
        }
        catch (error) {
            if (!(error instanceof AppError)) {
                this.logger.error('Unexpected error in sendMessage', error instanceof Error ? error.stack : error);
            }
            sse.send('error', toErrorBody(error));
        }
        finally {
            sse.end();
        }
    }
    async streamTextMessage(sse, message) {
        sse.send('message_start', { id: message.id, role: message.role, section: message.section, type: message.type });
        for (const token of tokenize(message.text ?? '')) {
            if (sse.isClosed) {
                break;
            }
            sse.send('token', { text: token });
            await delay(TOKEN_DELAY_MS);
        }
        sse.send('message_end', { id: message.id, text: message.text, quickReplies: null });
    }
};
__decorate([
    Post(),
    __param(0, CurrentDevice()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, CreateConversationDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "create", null);
__decorate([
    Get(':sessionId'),
    __param(0, CurrentDevice()),
    __param(1, Param('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "findOne", null);
__decorate([
    Delete(':sessionId'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, CurrentDevice()),
    __param(1, Param('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "remove", null);
__decorate([
    Post(':sessionId/sections/:sectionId/confirm'),
    __param(0, CurrentDevice()),
    __param(1, Param('sessionId')),
    __param(2, Param('sectionId')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String, String, ConfirmSectionDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "confirmSection", null);
__decorate([
    Post(':sessionId/messages'),
    __param(0, CurrentDevice()),
    __param(1, Param('sessionId')),
    __param(2, Body()),
    __param(3, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String, SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "sendMessage", null);
ConversationController = ConversationController_1 = __decorate([
    Controller('conversations'),
    __metadata("design:paramtypes", [ConversationService,
        SectionReplyService])
], ConversationController);
export { ConversationController };
//# sourceMappingURL=conversation.controller.js.map