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
var ApplicationsService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CvTailorService } from '../../ai/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { generateId } from '../../common/ids.js';
import { EMAIL_PROVIDER } from '../../integrations/email/email.interface.js';
import { CvService } from '../cv/index.js';
import { JobsService, toPlainText } from '../jobs/index.js';
import { contactForJobCountry } from './application-contact.js';
import { buildApplicationEmail, headerSafe } from './application-email.js';
import { ApplicationsRepository } from './applications.repository.js';
import { toApplicationDto } from './dto/application-response.dto.js';
import { Application } from './entities/application.entity.js';
const CONCURRENCY = 2;
const STALE_AFTER_MS = 3 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;
const SEND_ATTEMPTS = 2;
const SEND_RETRY_DELAY_MS = 2_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function str(entry, key) {
    const value = entry && typeof entry === 'object' ? entry[key] : undefined;
    return typeof value === 'string' ? value : '';
}
function bulletsOf(entry) {
    const value = entry && typeof entry === 'object' ? entry.bullets : undefined;
    return Array.isArray(value) ? value.filter((bullet) => typeof bullet === 'string') : [];
}
function toTailorInput(cv) {
    return {
        title: cv.title,
        experience: cv.experience.map((entry) => ({ title: str(entry, 'title'), company: str(entry, 'company'), bullets: bulletsOf(entry) })),
        projects: cv.projects.map((entry) => ({ title: str(entry, 'title'), description: str(entry, 'description'), bullets: bulletsOf(entry) })),
        skills: cv.skills.map((skill) => str(skill, 'name')).filter(Boolean),
    };
}
function applyTailoring(cv, tailored) {
    const withBullets = (entries, bullets) => entries.map((entry, index) => (entry && typeof entry === 'object' && Array.isArray(entry.bullets) ? { ...entry, bullets: bullets[index] } : entry));
    const skillsByName = new Map(cv.skills.map((skill) => [str(skill, 'name'), skill]));
    const orderedSkills = tailored.skillOrder.map((name) => skillsByName.get(name)).filter((skill) => skill !== undefined);
    return {
        ...cv,
        experience: withBullets(cv.experience, tailored.experienceBullets),
        projects: withBullets(cv.projects, tailored.projectBullets),
        skills: [...orderedSkills, ...cv.skills.filter((skill) => !orderedSkills.includes(skill))],
    };
}
let ApplicationsService = ApplicationsService_1 = class ApplicationsService {
    repository;
    cvService;
    jobsService;
    cvTailorService;
    configService;
    email;
    logger = new Logger(ApplicationsService_1.name);
    active = new Set();
    timer = null;
    constructor(repository, cvService, jobsService, cvTailorService, configService, email) {
        this.repository = repository;
        this.cvService = cvService;
        this.jobsService = jobsService;
        this.cvTailorService = cvTailorService;
        this.configService = configService;
        this.email = email;
    }
    onModuleInit() {
        this.timer = setInterval(() => {
            this.resumeStale().catch((error) => this.logger.error('Application resume sweep failed', error instanceof Error ? error.stack : error));
        }, SWEEP_INTERVAL_MS);
        this.timer.unref?.();
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async create(deviceId, jobIds) {
        if (!(await this.cvService.existsForDevice(deviceId))) {
            throw new AppError('NOT_FOUND', 'لسه معندكش سيرة ذاتية — اعملها الأول وبعدين قدّم', { retryable: false });
        }
        const jobs = await this.jobsService.findJobsByIds(jobIds);
        if (jobs.length !== jobIds.length) {
            throw new AppError('INVALID_REQUEST', 'في وظيفة من اللي اخترتها مبقتش موجودة، حدّث القايمة وجرب تاني', { retryable: false });
        }
        const jobsById = new Map(jobs.map((job) => [job.id, job]));
        const batchId = generateId('apb');
        const processing = await this.repository.inDeviceLock(deviceId, async (manager) => {
            const existing = new Map((await this.repository.findForJobs(deviceId, jobIds, manager)).map((application) => [application.jobId, application]));
            const toProcess = [];
            const alreadyApplied = [];
            for (const jobId of jobIds) {
                const previous = existing.get(jobId);
                if (previous && previous.status !== 'failed') {
                    alreadyApplied.push(previous);
                    continue;
                }
                const job = jobsById.get(jobId);
                toProcess.push(Object.assign(previous ?? Object.assign(new Application(), { id: generateId('app'), deviceId, jobId }), {
                    batchId,
                    method: job.applyMethod,
                    status: 'processing',
                    stage: 'tailoring',
                    jobTitle: job.title,
                    company: job.company,
                    location: job.location,
                    listingUrl: job.link,
                    recipientEmail: job.applyMethod === 'email' ? job.applyEmail : null,
                    tailoredCv: null,
                    cvTailored: false,
                    errorCode: null,
                    errorDetail: null,
                    providerMessageId: null,
                    sentAt: null,
                    preparedAt: null,
                    openedAt: null,
                    failedAt: null,
                }));
            }
            await this.repository.createBatch({
                id: batchId,
                deviceId,
                status: toProcess.length ? 'processing' : 'done',
                applicationIds: toProcess.map((application) => application.id),
                alreadyAppliedIds: alreadyApplied.map((application) => application.id),
                completedAt: toProcess.length ? null : new Date(),
            }, manager);
            for (const application of toProcess) {
                await this.repository.save(application, manager);
            }
            return toProcess.length;
        });
        if (processing) {
            void this.processBatch(batchId).catch((error) => this.logger.error(`Batch ${batchId} failed unexpectedly`, error instanceof Error ? error.stack : error));
        }
        return this.getBatch(deviceId, batchId);
    }
    async getBatch(deviceId, batchId) {
        const batch = await this.repository.findBatch(batchId, deviceId);
        if (!batch) {
            throw new AppError('NOT_FOUND', 'مش لاقيين التقديم ده', { retryable: false });
        }
        const order = (ids) => (applications) => ids.map((id) => applications.find((application) => application.id === id)).filter((application) => application !== undefined);
        const applications = order(batch.applicationIds)(await this.repository.findByIds(batch.applicationIds)).map(toApplicationDto);
        const alreadyApplied = order(batch.alreadyAppliedIds)(await this.repository.findByIds(batch.alreadyAppliedIds)).map(toApplicationDto);
        const byStatus = (...statuses) => applications.filter((application) => statuses.includes(application.status));
        return {
            batchId: batch.id,
            status: batch.status,
            progress: { total: applications.length, completed: applications.filter((application) => application.status !== 'processing').length },
            sent: byStatus('sent'),
            prepared: byStatus('prepared', 'opened'),
            failed: byStatus('failed'),
            processing: byStatus('processing'),
            alreadyApplied,
        };
    }
    async list(deviceId) {
        return { applications: (await this.repository.findAllForDevice(deviceId)).map(toApplicationDto) };
    }
    async markOpened(deviceId, id) {
        const application = await this.repository.findById(id, deviceId);
        if (!application) {
            throw new AppError('NOT_FOUND', 'مش لاقيين التقديم ده', { retryable: false });
        }
        if (application.method !== 'external') {
            throw new AppError('INVALID_REQUEST', 'التقديم ده اتبعت بالإيميل، مفيش إعلان تفتحه', { retryable: false });
        }
        if (application.status !== 'prepared' && application.status !== 'opened') {
            throw new AppError('INVALID_REQUEST', 'الوظيفة دي لسه بتتجهز', { retryable: true });
        }
        if (application.status === 'prepared') {
            application.status = 'opened';
            application.openedAt = new Date();
            await this.repository.save(application);
        }
        return toApplicationDto(application);
    }
    async getCvPdf(deviceId, id) {
        const application = await this.repository.findById(id, deviceId);
        if (!application) {
            throw new AppError('NOT_FOUND', 'مش لاقيين التقديم ده', { retryable: false });
        }
        if (!application.tailoredCv) {
            throw new AppError('NOT_FOUND', 'الـ CV بتاع الوظيفة دي لسه بيتجهز', { retryable: true });
        }
        return this.cvService.renderPdf(application.tailoredCv);
    }
    async findForJobs(deviceId, jobIds) {
        const applications = await this.repository.findForJobs(deviceId, jobIds);
        return new Map(applications.filter((application) => application.jobId).map((application) => [application.jobId, { id: application.id, status: application.status }]));
    }
    async processBatch(batchId) {
        const batch = await this.repository.findBatch(batchId);
        if (!batch)
            return;
        const pending = (await this.repository.findByIds(batch.applicationIds)).filter((application) => application.status === 'processing' && !this.active.has(application.id));
        if (pending.length) {
            const cv = await this.cvService.getForDevice(batch.deviceId).catch(() => null);
            let next = 0;
            const worker = async () => {
                while (next < pending.length) {
                    await this.processApplication(pending[next++], cv);
                }
            };
            await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
        }
        if ((await this.repository.countProcessingInBatch(batchId)) === 0 && batch.status !== 'done') {
            batch.status = 'done';
            batch.completedAt = new Date();
            await this.repository.saveBatch(batch);
        }
    }
    async processApplication(application, cv) {
        if (this.active.has(application.id))
            return;
        this.active.add(application.id);
        try {
            if (!cv) {
                return await this.fail(application, 'internal', 'The device has no CV any more.');
            }
            const [job] = application.jobId ? await this.jobsService.findJobsByIds([application.jobId]) : [];
            if (!job) {
                return await this.fail(application, 'job_unavailable', 'The job row no longer exists.');
            }
            if (!application.tailoredCv) {
                application.stage = 'tailoring';
                await this.repository.save(application);
                const tailored = await this.cvTailorService.tailor(toTailorInput(cv), { title: job.title, company: job.company, description: toPlainText(job.snippet) });
                application.tailoredCv = contactForJobCountry(applyTailoring(cv, tailored), job.country);
                application.cvTailored = tailored.tailored;
                await this.repository.save(application);
            }
            if (application.method === 'external') {
                application.status = 'prepared';
                application.stage = null;
                application.preparedAt = new Date();
                await this.repository.save(application);
                return;
            }
            await this.send(application);
        }
        catch (error) {
            await this.fail(application, 'internal', error instanceof Error ? error.message : String(error)).catch(() => undefined);
        }
        finally {
            this.active.delete(application.id);
        }
    }
    async send(application) {
        const cv = application.tailoredCv;
        const replyTo = cv.contact?.email?.trim();
        if (!replyTo || !EMAIL_PATTERN.test(replyTo)) {
            return this.fail(application, 'no_candidate_email', 'The CV has no valid email to use as Reply-To.');
        }
        if (!application.recipientEmail) {
            return this.fail(application, 'job_unavailable', 'An email-method application with no recipient address.');
        }
        application.stage = 'sending';
        await this.repository.save(application);
        const { file, filename } = this.cvService.renderPdf(cv);
        const content = buildApplicationEmail(cv, { title: application.jobTitle, company: application.company });
        const fromName = headerSafe(`${cv.name?.trim() || 'Candidate'} via ${this.configService.get('email.fromName', 'Sanad')}`);
        const fromAddress = this.configService.get('email.fromAddress', '');
        let lastError = '';
        for (let attempt = 0; attempt < SEND_ATTEMPTS; attempt++) {
            try {
                const sent = await this.email.send({
                    from: `"${fromName}" <${fromAddress}>`,
                    to: application.recipientEmail,
                    replyTo,
                    subject: content.subject,
                    text: content.text,
                    html: content.html,
                    attachments: [{ filename, content: file, contentType: 'application/pdf' }],
                    idempotencyKey: `${application.id}-${application.batchId}`,
                });
                application.status = 'sent';
                application.stage = null;
                application.sentAt = new Date();
                application.providerMessageId = sent.messageId;
                await this.repository.save(application);
                return;
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Sending application ${application.id} failed on attempt ${attempt + 1}: ${lastError}`);
                if (attempt < SEND_ATTEMPTS - 1)
                    await new Promise((resolve) => setTimeout(resolve, SEND_RETRY_DELAY_MS));
            }
        }
        await this.fail(application, 'send_failed', lastError);
    }
    async fail(application, code, detail) {
        application.status = 'failed';
        application.stage = null;
        application.errorCode = code;
        application.errorDetail = detail.slice(0, 2_000);
        application.failedAt = new Date();
        await this.repository.save(application);
        this.logger.warn(`Application ${application.id} failed (${code}).`);
    }
    async resumeStale() {
        const stale = (await this.repository.findStaleProcessing(new Date(Date.now() - STALE_AFTER_MS))).filter((application) => !this.active.has(application.id));
        for (const batchId of new Set(stale.map((application) => application.batchId))) {
            this.logger.log(`Resuming interrupted application batch ${batchId}.`);
            await this.processBatch(batchId);
        }
    }
};
ApplicationsService = ApplicationsService_1 = __decorate([
    Injectable(),
    __param(5, Inject(EMAIL_PROVIDER)),
    __metadata("design:paramtypes", [ApplicationsRepository,
        CvService,
        JobsService,
        CvTailorService,
        ConfigService, Object])
], ApplicationsService);
export { ApplicationsService };
//# sourceMappingURL=applications.service.js.map