import { Module } from '@nestjs/common';
import { LlmModule } from '../integrations/llm/llm.module.js';
import { CvAnalysisService } from './services/cv-analysis.service.js';
import { CvTailorService } from './services/cv-tailor.service.js';
import { JobMatchService } from './services/job-match.service.js';
import { SectionReplyService } from './services/section-reply.service.js';

@Module({
  imports: [LlmModule],
  providers: [SectionReplyService, CvAnalysisService, JobMatchService, CvTailorService],
  exports: [SectionReplyService, CvAnalysisService, JobMatchService, CvTailorService],
})
export class AiModule {}
