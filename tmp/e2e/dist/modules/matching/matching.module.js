var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let MatchingModule = class MatchingModule {
};
MatchingModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([JobMatchProfile, JobMatchExplanationRow]), AiModule, EmbeddingModule, CvModule, JobsModule, PreferencesModule, ApplicationsModule],
        controllers: [MatchingController],
        providers: [MatchingService, MatchingRepository],
    })
], MatchingModule);
export { MatchingModule };
//# sourceMappingURL=matching.module.js.map