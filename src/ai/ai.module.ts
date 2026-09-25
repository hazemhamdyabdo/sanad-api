import { Module } from '@nestjs/common';
import { LlmModule } from '../integrations/llm/llm.module.js';
import { CvAnalysisService } from './services/cv-analysis.service.js';
import { SectionReplyService } from './services/section-reply.service.js';

@Module({
  imports: [LlmModule],
  providers: [SectionReplyService, CvAnalysisService],
  exports: [SectionReplyService, CvAnalysisService],
})
export class AiModule {}
