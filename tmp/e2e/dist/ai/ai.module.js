var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { LlmModule } from '../integrations/llm/llm.module.js';
import { CvAnalysisService } from './services/cv-analysis.service.js';
import { CvTailorService } from './services/cv-tailor.service.js';
import { JobMatchService } from './services/job-match.service.js';
import { SectionReplyService } from './services/section-reply.service.js';
let AiModule = class AiModule {
};
AiModule = __decorate([
    Module({
        imports: [LlmModule],
        providers: [SectionReplyService, CvAnalysisService, JobMatchService, CvTailorService],
        exports: [SectionReplyService, CvAnalysisService, JobMatchService, CvTailorService],
    })
], AiModule);
export { AiModule };
//# sourceMappingURL=ai.module.js.map