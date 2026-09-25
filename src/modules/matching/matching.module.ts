import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../../ai/index.js';
import { EmbeddingModule } from '../../integrations/embeddings/embedding.module.js';
import { ApplicationsModule } from '../applications/index.js';
import { CvModule } from '../cv/index.js';
import { JobsModule } from '../jobs/index.js';
import { PreferencesModule } from '../preferences/index.js';
import { JobMatchExplanationRow } from './entities/job-match-explanation.entity.js';
import { JobMatchProfile } from './entities/job-match-profile.entity.js';
import { MatchingController } from './matching.controller.js';
import { MatchingRepository } from './matching.repository.js';
import { MatchingService } from './matching.service.js';

/** `GET /jobs/matches` — the CV (cv module) matched against stored jobs (jobs module) under the device's preferences (preferences module). */
@Module({
  imports: [TypeOrmModule.forFeature([JobMatchProfile, JobMatchExplanationRow]), AiModule, EmbeddingModule, CvModule, JobsModule, PreferencesModule, ApplicationsModule],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingRepository],
})
export class MatchingModule {}
