import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CvTailorService, type TailorCvInput, type TailoredCvContent } from '../../ai/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { generateId } from '../../common/ids.js';
import type { ApplicationStatus } from '../../common/types/contract.js';
import { EMAIL_PROVIDER, type EmailProvider } from '../../integrations/email/email.interface.js';
import { CvService, type CvResponseDto } from '../cv/index.js';
import { JobsService, toPlainText } from '../jobs/index.js';
import { contactForJobCountry } from './application-contact.js';
import { buildApplicationEmail, headerSafe } from './application-email.js';
import { applicationCvFilename } from './application-filename.js';
import { ApplicationsRepository } from './applications.repository.js';
import { summarize, toApplicationDto, type ApplicationBatchDto, type ApplicationDto, type ApplicationsListDto } from './dto/application-response.dto.js';
import { Application, type ApplicationErrorCode } from './entities/application.entity.js';

/** Applications processed at once per batch — tailoring is an LLM call each, so a small pool, not all at once. */
const CONCURRENCY = 2;
/** A `processing` application untouched this long was interrupted (restart/crash) and is picked up again. */
const STALE_AFTER_MS = 3 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;
const SEND_ATTEMPTS = 2;
const SEND_RETRY_DELAY_MS = 2_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(entry: unknown, key: string): string {
  const value = entry && typeof entry === 'object' ? (entry as Record<string, unknown>)[key] : undefined;
  return typeof value === 'string' ? value : '';
}

function bulletsOf(entry: unknown): string[] {
  const value = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).bullets : undefined;
  return Array.isArray(value) ? value.filter((bullet): bullet is string => typeof bullet === 'string') : [];
}

function toTailorInput(cv: CvResponseDto): TailorCvInput {
  return {
    title: cv.title,
    experience: cv.experience.map((entry) => ({ title: str(entry, 'title'), company: str(entry, 'company'), bullets: bulletsOf(entry) })),
    projects: cv.projects.map((entry) => ({ title: str(entry, 'title'), description: str(entry, 'description'), bullets: bulletsOf(entry) })),
    skills: cv.skills.map((skill) => str(skill, 'name')).filter(Boolean),
  };
}

/** The user's CV with only what tailoring may change swapped in — every other field is the original, untouched. */
function applyTailoring(cv: CvResponseDto, tailored: TailoredCvContent): CvResponseDto {
  const withBullets = (entries: unknown[], bullets: string[][]) =>
    entries.map((entry, index) => (entry && typeof entry === 'object' && Array.isArray((entry as Record<string, unknown>).bullets) ? { ...entry, bullets: bullets[index] } : entry));
  const skillsByName = new Map(cv.skills.map((skill) => [str(skill, 'name'), skill]));
  const orderedSkills: unknown[] = tailored.skillOrder.map((name) => skillsByName.get(name)).filter((skill) => skill !== undefined);
  return {
    ...cv,
    experience: withBullets(cv.experience, tailored.experienceBullets),
    projects: withBullets(cv.projects, tailored.projectBullets),
    // Any skill without a name (shouldn't exist) keeps its place at the end rather than being dropped.
    skills: [...orderedSkills, ...cv.skills.filter((skill) => !orderedSkills.includes(skill))],
  };
}

/**
 * Real applying, split by the job's apply method — see API-CONTRACT.md §7.
 *
 * - `email`: tailor the CV to the listing, render it to PDF, email it to the company with the
 *   candidate as Reply-To → `sent`.
 * - `external`: tailor the CV the same way and keep it downloadable → `prepared`. Never counted as
 *   applied; becomes `opened` when the app reports the user opened the listing, and `submitted`
 *   when the user says they finished applying there — only then does it count as applied.
 *
 * `POST /applications` returns at once; the work runs in the background and the app polls the
 * batch. Nothing is lost to a restart: stale `processing` rows are picked up again by a sweep, and
 * an email retried after a crash reuses its idempotency key, so the company never gets it twice.
 */
@Injectable()
export class ApplicationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApplicationsService.name);
  /** Applications this process is working on right now — the stale sweep must not start them twice. */
  private readonly active = new Set<string>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly cvService: CvService,
    private readonly jobsService: JobsService,
    private readonly cvTailorService: CvTailorService,
    private readonly configService: ConfigService,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.resumeStale().catch((error) => this.logger.error('Application resume sweep failed', error instanceof Error ? error.stack : error));
    }, SWEEP_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async create(deviceId: string, jobIds: string[]): Promise<ApplicationBatchDto> {
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
      const toProcess: Application[] = [];
      const alreadyApplied: Application[] = [];

      for (const jobId of jobIds) {
        const previous = existing.get(jobId);
        // The one-application-per-job rule: only a failed attempt may be tried again.
        if (previous && previous.status !== 'failed') {
          alreadyApplied.push(previous);
          continue;
        }
        const job = jobsById.get(jobId)!;
        toProcess.push(
          Object.assign(previous ?? Object.assign(new Application(), { id: generateId('app'), deviceId, jobId }), {
            batchId,
            method: job.applyMethod,
            status: 'processing' satisfies ApplicationStatus,
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
            submittedAt: null,
            failedAt: null,
          } satisfies Partial<Application>),
        );
      }

      // The batch row first — applications reference it.
      await this.repository.createBatch(
        {
          id: batchId,
          deviceId,
          status: toProcess.length ? 'processing' : 'done',
          applicationIds: toProcess.map((application) => application.id),
          alreadyAppliedIds: alreadyApplied.map((application) => application.id),
          completedAt: toProcess.length ? null : new Date(),
        },
        manager,
      );
      for (const application of toProcess) {
        await this.repository.save(application, manager);
      }
      return toProcess.length;
    });

    if (processing) {
      // Deliberately not awaited — 202 now, the app polls the batch (same pattern as CV uploads).
      void this.processBatch(batchId).catch((error) => this.logger.error(`Batch ${batchId} failed unexpectedly`, error instanceof Error ? error.stack : error));
    }
    return this.getBatch(deviceId, batchId);
  }

  async getBatch(deviceId: string, batchId: string): Promise<ApplicationBatchDto> {
    const batch = await this.repository.findBatch(batchId, deviceId);
    if (!batch) {
      throw new AppError('NOT_FOUND', 'مش لاقيين التقديم ده', { retryable: false });
    }
    const order = (ids: string[]) => (applications: Application[]) => ids.map((id) => applications.find((application) => application.id === id)).filter((application) => application !== undefined);
    const applications = order(batch.applicationIds)(await this.repository.findByIds(batch.applicationIds)).map(toApplicationDto);
    if (batch.status !== 'done' && applications.every((application) => application.status !== 'processing')) {
      // Every application reached a final state but the batch row never did (a crash between the last
      // application's save and the batch's) — the app must see "done", never an in-progress batch with nothing left to do.
      batch.status = 'done';
      batch.completedAt = new Date();
      await this.repository.saveBatch(batch);
    }
    const alreadyApplied = order(batch.alreadyAppliedIds)(await this.repository.findByIds(batch.alreadyAppliedIds)).map(toApplicationDto);
    const byStatus = (...statuses: ApplicationStatus[]) => applications.filter((application) => statuses.includes(application.status));

    return {
      batchId: batch.id,
      status: batch.status,
      progress: { total: applications.length, completed: applications.filter((application) => application.status !== 'processing').length },
      sent: byStatus('sent'),
      prepared: byStatus('prepared', 'opened'),
      submitted: byStatus('submitted'),
      failed: byStatus('failed'),
      processing: byStatus('processing'),
      alreadyApplied,
    };
  }

  async list(deviceId: string): Promise<ApplicationsListDto> {
    const applications = (await this.repository.findAllForDevice(deviceId)).map(toApplicationDto);
    return { applications, summary: summarize(applications) };
  }

  /** The app reports the user opened an external listing. Idempotent — the first open's time is kept. */
  async markOpened(deviceId: string, id: string): Promise<ApplicationDto> {
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

  /**
   * The user reports finishing an `external` application on the listing site — the only way we can
   * know. Allowed from `prepared` as well as `opened`: the user may have reached the listing some
   * other way. Idempotent — the first report's time is kept.
   */
  async markSubmitted(deviceId: string, id: string): Promise<ApplicationDto> {
    const application = await this.repository.findById(id, deviceId);
    if (!application) {
      throw new AppError('NOT_FOUND', 'مش لاقيين التقديم ده', { retryable: false });
    }
    if (application.method !== 'external') {
      throw new AppError('INVALID_REQUEST', 'التقديم ده اتبعت بالإيميل، مفيش حاجة تكمّلها', { retryable: false });
    }
    if (application.status === 'processing' || application.status === 'failed') {
      throw new AppError('INVALID_REQUEST', 'الوظيفة دي لسه متجهزتش، استنى الـ CV يخلص الأول', { retryable: application.status === 'processing' });
    }
    if (application.status !== 'submitted') {
      application.status = 'submitted';
      application.submittedAt = new Date();
      await this.repository.save(application);
    }
    return toApplicationDto(application);
  }

  /** The tailored CV as a PDF, named per job (`Name-JobTitle-Company.pdf`) so 20 downloads stay tellable apart. */
  async getCvPdf(deviceId: string, id: string): Promise<{ file: Buffer; filename: string }> {
    const application = await this.repository.findById(id, deviceId);
    if (!application) {
      throw new AppError('NOT_FOUND', 'مش لاقيين التقديم ده', { retryable: false });
    }
    if (!application.tailoredCv) {
      throw new AppError('NOT_FOUND', 'الـ CV بتاع الوظيفة دي لسه بيتجهز', { retryable: true });
    }
    return { file: this.cvService.renderPdf(application.tailoredCv).file, filename: applicationCvFilename(application) };
  }

  /** For job matching: which of these jobs the device already has an application for. */
  async findForJobs(deviceId: string, jobIds: string[]): Promise<Map<string, { id: string; status: ApplicationStatus }>> {
    const applications = await this.repository.findForJobs(deviceId, jobIds);
    return new Map(applications.filter((application) => application.jobId).map((application) => [application.jobId!, { id: application.id, status: application.status }]));
  }

  private async processBatch(batchId: string): Promise<void> {
    const batch = await this.repository.findBatch(batchId);
    if (!batch) return;
    const pending = (await this.repository.findByIds(batch.applicationIds)).filter((application) => application.status === 'processing' && !this.active.has(application.id));

    if (pending.length) {
      // One CV snapshot for the whole batch — every job in one request gets tailored from the same CV.
      const cv = await this.cvService.getForDevice(batch.deviceId).catch(() => null);
      let next = 0;
      const worker = async () => {
        while (next < pending.length) {
          await this.processApplication(pending[next++]!, cv);
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

  private async processApplication(application: Application, cv: CvResponseDto | null): Promise<void> {
    if (this.active.has(application.id)) return;
    this.active.add(application.id);
    try {
      if (!cv) {
        return await this.fail(application, 'internal', 'The device has no CV any more.');
      }
      const [job] = application.jobId ? await this.jobsService.findJobsByIds([application.jobId]) : [];
      if (!job) {
        return await this.fail(application, 'job_unavailable', 'The job row no longer exists.');
      }

      // A resumed application may already have its tailored CV — tailoring again would only change it.
      if (!application.tailoredCv) {
        application.stage = 'tailoring';
        await this.repository.save(application);
        const tailored = await this.cvTailorService.tailor(toTailorInput(cv), { title: job.title, company: job.company, description: toPlainText(job.snippet) });
        // Contact details as this job's country needs them (dialable phone, location with country) —
        // part of "the CV used for this job", so the PDF, the download and the email all agree.
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
    } catch (error) {
      await this.fail(application, 'internal', error instanceof Error ? error.message : String(error)).catch(() => undefined);
    } finally {
      this.active.delete(application.id);
    }
  }

  private async send(application: Application): Promise<void> {
    const cv = application.tailoredCv!;
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
    const fromName = headerSafe(`${cv.name?.trim() || 'Candidate'} via ${this.configService.get<string>('email.fromName', 'Sanad')}`);
    const fromAddress = this.configService.get<string>('email.fromAddress', '');

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
          // Per application AND batch: a crash-resume in the same batch can't double-send, while a
          // user retrying a failed application later gets a genuinely new send.
          idempotencyKey: `${application.id}-${application.batchId}`,
        });
        application.status = 'sent';
        application.stage = null;
        application.sentAt = new Date();
        application.providerMessageId = sent.messageId;
        await this.repository.save(application);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Sending application ${application.id} failed on attempt ${attempt + 1}: ${lastError}`);
        if (attempt < SEND_ATTEMPTS - 1) await new Promise((resolve) => setTimeout(resolve, SEND_RETRY_DELAY_MS));
      }
    }
    await this.fail(application, 'send_failed', lastError);
  }

  private async fail(application: Application, code: ApplicationErrorCode, detail: string): Promise<void> {
    application.status = 'failed';
    application.stage = null;
    application.errorCode = code;
    application.errorDetail = detail.slice(0, 2_000);
    application.failedAt = new Date();
    await this.repository.save(application);
    this.logger.warn(`Application ${application.id} failed (${code}).`);
  }

  /** Picks up applications a restart or crash left mid-way. */
  private async resumeStale(): Promise<void> {
    const stale = (await this.repository.findStaleProcessing(new Date(Date.now() - STALE_AFTER_MS))).filter((application) => !this.active.has(application.id));
    for (const batchId of new Set(stale.map((application) => application.batchId))) {
      this.logger.log(`Resuming interrupted application batch ${batchId}.`);
      await this.processBatch(batchId);
    }
  }
}
