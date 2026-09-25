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
var JobMatchService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { delay } from '../../common/delay.js';
import { EXTRACTION_LLM_PROVIDER } from '../../integrations/llm/llm.interface.js';
import { buildJobMatchPrompt } from '../prompts/job-match.prompt.js';
import { jobMatchEnvelopeSchema, jobMatchItemSchema } from '../schemas/job-match.schema.js';
const BATCH_SIZE = 8;
const MAX_CONCURRENT_BATCHES = 3;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_500;
const MATCH_MAX_TOKENS = 3_000;
const YEARS_WORD = /سنة|سنين|سنوات|سنه|year/i;
function dropMetYearsGaps(gaps, candidateYears) {
    if (candidateYears === null) {
        return gaps;
    }
    return gaps.filter((gap) => {
        if (!YEARS_WORD.test(gap)) {
            return true;
        }
        const western = gap.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
        const numbers = (western.match(/\d+(\.\d+)?/g) ?? []).map(Number);
        return !numbers.length || Math.min(...numbers) > candidateYears;
    });
}
const JUNIOR_WORD = /junior|entry[\s-]?level|جونيور|مبتدئ/i;
function dropJuniorGaps(gaps, seniority) {
    return seniority === 'mid' || seniority === 'senior' ? gaps.filter((gap) => !JUNIOR_WORD.test(gap)) : gaps;
}
function extractJsonObject(raw) {
    const trimmed = raw.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    return start === -1 || end < start ? trimmed : trimmed.slice(start, end + 1);
}
let JobMatchService = JobMatchService_1 = class JobMatchService {
    llm;
    logger = new Logger(JobMatchService_1.name);
    constructor(llm) {
        this.llm = llm;
    }
    async explain(candidate, jobs) {
        const batches = [];
        for (let start = 0; start < jobs.length; start += BATCH_SIZE) {
            batches.push(jobs.slice(start, start + BATCH_SIZE));
        }
        const results = new Map();
        let next = 0;
        const worker = async () => {
            while (next < batches.length) {
                const batch = batches[next++];
                for (const explanation of await this.explainBatch(candidate, batch)) {
                    results.set(explanation.jobId, explanation);
                }
            }
        };
        await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_BATCHES, batches.length) }, worker));
        return results;
    }
    async explainBatch(candidate, batch) {
        const explained = new Map();
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const missing = batch.filter((job) => !explained.has(job.id));
            if (!missing.length) {
                break;
            }
            if (attempt > 0) {
                await delay(RETRY_BASE_DELAY_MS * attempt);
            }
            let raw;
            try {
                raw = await this.llm.complete({ messages: buildJobMatchPrompt(candidate, missing), temperature: 0, jsonMode: true, maxTokens: MATCH_MAX_TOKENS });
            }
            catch (error) {
                this.logger.warn(`Job match call failed on attempt ${attempt + 1}: ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
            let parsed;
            try {
                parsed = JSON.parse(extractJsonObject(raw));
            }
            catch {
                this.logger.warn(`Job match output was not valid JSON on attempt ${attempt + 1}.`);
                continue;
            }
            const envelope = jobMatchEnvelopeSchema.safeParse(parsed);
            if (!envelope.success) {
                this.logger.warn(`Job match output had no "matches" array on attempt ${attempt + 1}.`);
                continue;
            }
            const wanted = new Set(missing.map((job) => job.id));
            const rejections = [];
            for (const item of envelope.data.matches) {
                const result = jobMatchItemSchema.safeParse(item);
                if (result.success && wanted.has(result.data.jobId) && !explained.has(result.data.jobId)) {
                    explained.set(result.data.jobId, { ...result.data, gaps: dropJuniorGaps(dropMetYearsGaps(result.data.gaps, candidate.yearsOfExperience), candidate.seniority) });
                }
                else {
                    rejections.push(result.success ? 'unknown or duplicate jobId' : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '));
                }
            }
            if (rejections.length) {
                this.logger.warn(`Job match attempt ${attempt + 1}: rejected ${rejections.length} item(s) — ${[...new Set(rejections)].join(' | ')}`);
            }
        }
        const unexplained = batch.length - explained.size;
        if (unexplained) {
            this.logger.warn(`Job match gave up on ${unexplained} of ${batch.length} job(s) after ${MAX_ATTEMPTS} attempts.`);
        }
        return [...explained.values()];
    }
};
JobMatchService = JobMatchService_1 = __decorate([
    Injectable(),
    __param(0, Inject(EXTRACTION_LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], JobMatchService);
export { JobMatchService };
//# sourceMappingURL=job-match.service.js.map