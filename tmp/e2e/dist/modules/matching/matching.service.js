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
var MatchingService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JOB_MATCH_PROMPT_VERSION, JobMatchService } from '../../ai/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { WORLDWIDE } from '../../common/types/contract.js';
import { EMBEDDING_PROVIDER } from '../../integrations/embeddings/embedding.interface.js';
import { ApplicationsService } from '../applications/index.js';
import { CvService } from '../cv/index.js';
import { JobsService, TARGET_COUNTRIES, toPlainText } from '../jobs/index.js';
import { PreferencesService } from '../preferences/index.js';
import { buildCandidateEmbeddingText, buildMatchCandidate, hashCandidate } from './candidate-profile.js';
import { MatchingRepository } from './matching.repository.js';
const CANDIDATE_LIMIT = 25;
const MIN_MATCH = 40;
const MAX_DESCRIPTION_CHARS = 1_500;
const ROLE_MATCH_RANK = { exact: 0, adjacent: 1, related: 2 };
let MatchingService = MatchingService_1 = class MatchingService {
    cvService;
    jobsService;
    preferencesService;
    matchingRepository;
    jobMatchService;
    applicationsService;
    embeddings;
    logger = new Logger(MatchingService_1.name);
    inFlight = new Map();
    constructor(cvService, jobsService, preferencesService, matchingRepository, jobMatchService, applicationsService, embeddings) {
        this.cvService = cvService;
        this.jobsService = jobsService;
        this.preferencesService = preferencesService;
        this.matchingRepository = matchingRepository;
        this.jobMatchService = jobMatchService;
        this.applicationsService = applicationsService;
        this.embeddings = embeddings;
    }
    getMatches(device) {
        const previous = this.inFlight.get(device.id) ?? Promise.resolve();
        const run = previous.catch(() => undefined).then(() => this.computeMatches(device));
        this.inFlight.set(device.id, run);
        const cleanup = () => {
            if (this.inFlight.get(device.id) === run) {
                this.inFlight.delete(device.id);
            }
        };
        run.then(cleanup, cleanup);
        return run;
    }
    async computeMatches(device) {
        const preferences = await this.preferencesService.getForDevice(device);
        const candidate = await this.loadCandidate(device.id);
        const targetRole = await this.jobsService.resolveTargetRole(candidate.title, candidate.pastTitles);
        const isWorldwide = preferences.country === WORLDWIDE;
        const country = TARGET_COUNTRIES.find((code) => code === preferences.country) ?? null;
        if (!isWorldwide && !country) {
            return { status: 'ready', preferences, jobs: [] };
        }
        const status = await this.requestIngestion(targetRole, country);
        await this.jobsService.enrichPendingJobs(country ? [country] : null);
        const profile = await this.ensureProfile(device.id, candidate, targetRole);
        const similar = await this.jobsService.searchSimilarJobs(profile.embedding, {
            countries: country ? [country] : null,
            workTypes: preferences.workTypes,
            city: country ? preferences.city : null,
            group: targetRole?.group ?? null,
        }, CANDIDATE_LIMIT);
        if (!similar.length) {
            return { status, preferences, jobs: [] };
        }
        const jobs = await this.jobsService.findJobsByIds(similar.map((row) => row.id));
        const explanations = await this.explain(device.id, profile.hash, candidate, jobs);
        const similarity = new Map(similar.map((row) => [row.id, row.similarity]));
        const applications = await this.applicationsService.findForJobs(device.id, jobs.map((job) => job.id));
        const matched = jobs
            .filter((job) => {
            const explanation = explanations.get(job.id);
            return !!explanation && explanation.match >= MIN_MATCH && explanation.whyMatch.length > 0;
        })
            .map((job) => toMatchedJobDto(job, explanations.get(job.id), roleMatchFor(job, targetRole), applications.get(job.id) ?? null))
            .sort((a, b) => ROLE_MATCH_RANK[a.roleMatch] - ROLE_MATCH_RANK[b.roleMatch] ||
            b.match - a.match ||
            (similarity.get(b.id) ?? 0) - (similarity.get(a.id) ?? 0));
        return { status, preferences, jobs: matched };
    }
    async loadCandidate(deviceId) {
        const [cv, analysis] = await Promise.all([
            this.cvService.existsForDevice(deviceId).then((exists) => (exists ? this.cvService.getForDevice(deviceId) : null)),
            this.cvService.getAnalysisForDevice(deviceId),
        ]);
        if (!cv && !analysis) {
            throw new AppError('NOT_FOUND', 'لسه معندكش سيرة ذاتية — اعملها الأول وبعدين نلاقيلك وظايف', { retryable: false });
        }
        const candidate = buildMatchCandidate(cv, analysis);
        if (!candidate) {
            throw new AppError('INVALID_REQUEST', 'كمّل المسمى الوظيفي أو المهارات في الـ CV الأول عشان نقدر نلاقيلك وظايف مناسبة', { retryable: false });
        }
        return candidate;
    }
    async requestIngestion(targetRole, country) {
        if (!targetRole || !country) {
            return 'ready';
        }
        await this.jobsService.ensureRoleIngested(targetRole.code, country);
        return (await this.jobsService.getIngestionStatus(targetRole.group, country)) === 'pending' ? 'searching' : 'ready';
    }
    async ensureProfile(deviceId, candidate, targetRole) {
        const hash = hashCandidate(candidate, JOB_MATCH_PROMPT_VERSION);
        const stored = await this.matchingRepository.findProfile(deviceId);
        if (stored && stored.profileHash === hash && stored.embeddingModel === this.embeddings.model) {
            return { hash, embedding: stored.embedding };
        }
        const [embedding] = await this.embeddings.embed([buildCandidateEmbeddingText(candidate, targetRole)]);
        await this.matchingRepository.replaceProfile(deviceId, { profileHash: hash, embeddingModel: this.embeddings.model, embedding });
        this.logger.log(stored ? 'CV changed since the last match — re-embedded, explanation cache cleared.' : 'Embedded CV for its first match.');
        return { hash, embedding };
    }
    async explain(deviceId, profileHash, candidate, jobs) {
        const cached = await this.matchingRepository.findExplanations(deviceId, profileHash, jobs.map((job) => job.id));
        const explanations = new Map(cached.map((row) => [row.jobId, { match: row.match, whyMatch: row.whyMatch, gaps: row.gaps }]));
        const missing = jobs.filter((job) => !explanations.has(job.id));
        if (!missing.length) {
            return explanations;
        }
        const fresh = await this.jobMatchService.explain(candidate, missing.map((job) => ({ id: job.id, title: job.title, company: job.company, description: toPlainText(job.snippet).slice(0, MAX_DESCRIPTION_CHARS) })));
        await this.matchingRepository.saveExplanations(deviceId, profileHash, [...fresh.values()]);
        for (const explanation of fresh.values()) {
            explanations.set(explanation.jobId, explanation);
        }
        this.logger.log(`Explained ${fresh.size}/${missing.length} new job(s); ${cached.length} from cache.`);
        if (!explanations.size) {
            throw new AppError('AI_UNAVAILABLE', 'مش قادرين نقيّم الوظايف دلوقتي، جرب تاني كمان شوية', { retryable: true });
        }
        return explanations;
    }
};
MatchingService = MatchingService_1 = __decorate([
    Injectable(),
    __param(6, Inject(EMBEDDING_PROVIDER)),
    __metadata("design:paramtypes", [CvService,
        JobsService,
        PreferencesService,
        MatchingRepository,
        JobMatchService,
        ApplicationsService, Object])
], MatchingService);
export { MatchingService };
function roleMatchFor(job, targetRole) {
    if (!targetRole) {
        return 'related';
    }
    if (job.role === targetRole.code) {
        return 'exact';
    }
    return job.group === targetRole.group ? 'adjacent' : 'related';
}
function toMatchedJobDto(job, explanation, roleMatch, application) {
    return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        city: job.city,
        employmentType: job.employmentType ?? 'full_time',
        workType: job.workType ?? 'on_site',
        postedAt: (job.sourceUpdatedAt ?? job.firstSeenAt).toISOString(),
        match: explanation.match,
        roleMatch,
        whyMatch: explanation.whyMatch,
        gaps: explanation.gaps,
        apply: { method: job.applyMethod, url: job.link, email: job.applyEmail },
        application,
    };
}
//# sourceMappingURL=matching.service.js.map