import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import type { Device } from '../device/index.js';
import { ConversationService } from './conversation.service.js';
import type { ConversationResponseDto } from './dto/conversation-response.dto.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

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
}
