import { Module } from '@nestjs/common';
import { SttModule } from '../../integrations/stt/stt.module.js';
import { ConversationModule } from '../conversation/index.js';
import { TranscriptionController } from './transcription.controller.js';
import { TranscriptionService } from './transcription.service.js';

@Module({
  imports: [SttModule, ConversationModule],
  controllers: [TranscriptionController],
  providers: [TranscriptionService],
})
export class TranscriptionModule {}
