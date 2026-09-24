import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SectionReplyService } from '../../ai/index.js';
import { delay } from '../../common/delay.js';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { toErrorBody } from '../../common/errors/to-error-body.js';
import { SseWriter } from '../../common/sse/sse-writer.js';
import { tokenize } from '../../common/sse/tokenize.js';
import { SECTION_CARD_ACTIONS, type SectionId } from '../../common/types/contract.js';
import type { Device } from '../device/index.js';
import { ConversationService } from './conversation.service.js';
import { ConfirmSectionDto } from './dto/confirm-section.dto.js';
import type { ConfirmSectionResponseDto } from './dto/confirm-section-response.dto.js';
import { toMessageResponseDto, type ConversationResponseDto } from './dto/conversation-response.dto.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

const TOKEN_DELAY_MS = 30;

@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly sectionReplyService: SectionReplyService,
  ) {}

  @Post()
  create(@CurrentDevice() device: Device, @Body() dto: CreateConversationDto): Promise<ConversationResponseDto> {
    return this.conversationService.create(device.id, dto);
  }

  @Get(':sessionId')
  findOne(@CurrentDevice() device: Device, @Param('sessionId') sessionId: string): Promise<ConversationResponseDto> {
    return this.conversationService.findByIdForDevice(sessionId, device.id);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentDevice() device: Device, @Param('sessionId') sessionId: string): Promise<void> {
    return this.conversationService.deleteByIdForDevice(sessionId, device.id);
  }

  @Post(':sessionId/sections/:sectionId/confirm')
  confirmSection(
    @CurrentDevice() device: Device,
    @Param('sessionId') sessionId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: ConfirmSectionDto,
  ): Promise<ConfirmSectionResponseDto> {
    return this.conversationService.confirmSection(sessionId, device.id, sectionId as SectionId, dto);
  }

  @Post(':sessionId/messages')
  async sendMessage(
    @CurrentDevice() device: Device,
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    // Validation and ownership checks happen before we touch the response,
    // so a bad request still gets a normal JSON error, not a broken stream.
    const session = await this.conversationService.getActiveOwnedSession(sessionId, device.id);
    const section = session.currentSection ?? 'basic';
    const history = await this.conversationService.getMessageHistoryForPrompt(session.id, section);
    const previousBestCard = await this.conversationService.getBestPriorSectionCard(session.id, section);

    // Saved before the AI starts, per the contract — a dropped connection
    // can always be recovered with GET /conversations/:sessionId.
    const userMessage = await this.conversationService.appendUserMessage(session, dto);

    const sse = new SseWriter(res);
    sse.startHeartbeat();
    sse.send('user_message', toMessageResponseDto(userMessage));

    try {
      const reply = await this.sectionReplyService.generate(section, history, dto.text, previousBestCard);

      // Persisted before any SSE event about it goes out, for the same reason.
      const aiMessage = await this.conversationService.appendAiTextMessage(session, reply);

      sse.send('message_start', { id: aiMessage.id, role: aiMessage.role, section: aiMessage.section, type: aiMessage.type });

      for (const token of tokenize(reply.message)) {
        if (sse.isClosed) {
          break;
        }
        sse.send('token', { text: token });
        await delay(TOKEN_DELAY_MS);
      }

      sse.send('message_end', { id: aiMessage.id, text: aiMessage.text, quickReplies: null });

      if (reply.section === 'experience' && reply.hasNoExperience) {
        // No card to confirm here — the section itself is replaced, per the contract's own note that `projects` stands in for `experience` when the user hasn't worked before.
        await this.conversationService.switchExperienceToProjects(session);
      } else if (reply.sectionDone && reply.card) {
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
    } catch (error) {
      sse.send('error', toErrorBody(error));
    } finally {
      sse.end();
    }
  }
}
