import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvModule } from '../cv/index.js';
import { ConversationController } from './conversation.controller.js';
import { ConversationRepository } from './conversation.repository.js';
import { ConversationService } from './conversation.service.js';
import { ConversationSession } from './entities/conversation-session.entity.js';
import { Message } from './entities/message.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationSession, Message]), CvModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationRepository],
  exports: [ConversationService],
})
export class ConversationModule {}
