import { Module } from '@nestjs/common';
import { LlmModule } from '../integrations/llm/llm.module.js';
import { SectionReplyService } from './services/section-reply.service.js';

@Module({
  imports: [LlmModule],
  providers: [SectionReplyService],
  exports: [SectionReplyService],
})
export class AiModule {}
