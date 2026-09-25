var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CvAnalysisService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SECTION_IDS } from '../../common/types/contract.js';
import { EXTRACTION_LLM_PROVIDER } from '../../integrations/llm/llm.interface.js';
import { buildCvAnalysisPrompt } from '../prompts/cv-analysis.prompt.js';
import { cvAnalysisSchema } from '../schemas/cv-analysis.schema.js';
const JSON_ONLY_REMINDER = 'رد بكائن JSON بس، من غير أي نص قبله أو بعده، بالشكل المتفق عليه بالظبط.';
const MAX_ATTEMPTS = 3;
const ANALYSIS_MAX_TOKENS = 8_000;
function extractJsonObject(raw) {
    const trimmed = raw.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
        return trimmed;
    }
    return trimmed.slice(start, end + 1);
}
function computeSectionConfidence(cv) {
    const hasBasics = !!cv.basic.name && !!cv.basic.title && (!!cv.basic.phone || !!cv.basic.email);
    const hasExperience = cv.experience.length > 0;
    const hasProjects = cv.projects.length > 0;
    const confidence = {
        basic: hasBasics ? 'high' : 'low',
        experience: hasExperience ? 'high' : hasProjects ? 'n/a' : 'low',
        projects: hasProjects ? 'high' : 'n/a',
        education: cv.education.length > 0 ? 'high' : 'low',
        certificates: 'high',
        skills: cv.skills.length > 0 ? 'high' : 'low',
        languages: cv.languages.length > 0 ? 'high' : 'low',
    };
    for (const id of SECTION_IDS) {
        if (!(id in confidence)) {
            throw new Error(`computeSectionConfidence is missing a rule for section "${id}".`);
        }
    }
    return confidence;
}
let CvAnalysisService = CvAnalysisService_1 = class CvAnalysisService {
    llm;
    logger = new Logger(CvAnalysisService_1.name);
    constructor(llm) {
        this.llm = llm;
    }
    async analyze(pdf, mimeType) {
        const initialMessages = buildCvAnalysisPrompt(pdf, mimeType);
        let messages = initialMessages;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const raw = await this.llm.complete({ messages, temperature: 0, jsonMode: true, maxTokens: ANALYSIS_MAX_TOKENS });
            let parsed;
            let retryReason = 'The response was not valid JSON.';
            try {
                parsed = JSON.parse(extractJsonObject(raw));
            }
            catch {
                this.logger.warn(`CV analysis output was not valid JSON on attempt ${attempt + 1}: ${raw.slice(0, 200)}`);
            }
            if (parsed !== undefined) {
                const result = cvAnalysisSchema.safeParse(parsed);
                if (result.success) {
                    return { success: true, data: this.withConfidence(result.data) };
                }
                retryReason = `Fix these schema errors: ${result.error.issues
                    .slice(0, 12)
                    .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
                    .join('; ')}`;
                this.logger.warn(`CV analysis output failed validation on attempt ${attempt + 1}: ${JSON.stringify(result.error.issues)}`);
            }
            if (attempt < MAX_ATTEMPTS - 1) {
                messages = [...messages, { role: 'assistant', content: raw }, { role: 'user', content: `${retryReason}\n${JSON_ONLY_REMINDER}` }];
            }
        }
        this.logger.warn('CV analysis failed after all retries.');
        return { success: false };
    }
    withConfidence(data) {
        return { ...data, sectionConfidence: computeSectionConfidence(data.cv) };
    }
};
CvAnalysisService = CvAnalysisService_1 = __decorate([
    Injectable(),
    __param(0, Inject(EXTRACTION_LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], CvAnalysisService);
export { CvAnalysisService };
//# sourceMappingURL=cv-analysis.service.js.map