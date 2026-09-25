import { Inject, Injectable, Logger } from '@nestjs/common';
import { JOB_MATCH_PROMPT_VERSION, JobMatchService, type MatchCandidate } from '../../ai/index.js';
import { delay } from '../../common/delay.js';
import { AppError } from '../../common/errors/app-error.js';
import { WORLDWIDE, type MatchesStatus, type RoleMatch } from '../../common/types/contract.js';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from '../../integrations/embeddings/embedding.interface.js';
import { ApplicationsService } from '../applications/index.js';
import { CvService } from '../cv/index.js';
import type { Device } from '../device/index.js';
import { isInMarket, JobsService, TARGET_COUNTRIES, toPlainText, type Job, type RoleDefinition, type TargetCountry } from '../jobs/index.js';
import { PreferencesService } from '../preferences/index.js';
import { buildCandidateEmbeddingText, buildMatchCandidate, hashCandidate } from './candidate-profile.js';
import { collapseDuplicates } from './collapse-duplicates.js';
import type { JobMatchesResponseDto, MatchedJobDto } from './dto/job-matches-response.dto.js';
import { MatchingRepository } from './matching.repository.js';

/** How many jobs the vector stage hands to the LLM stage — the "top 20-30". */
const CANDIDATE_LIMIT = 25;
/** Below this the job isn't a match worth showing — the LLM's own rubric calls it "مش مناسبة غالبًا". */
const MIN_MATCH = 40;
/** Longer descriptions add tokens, not signal, to the explanation call. */
const MAX_DESCRIPTION_CHARS = 1_500;

const ROLE_MATCH_RANK: Record<RoleMatch, number> = { exact: 0, adjacent: 1, related: 2 };
/** How long a poll waits on an explanation run someone else started before answering with what's cached. */
const FIRST_RESULTS_WAIT_MS = 2_000;

/**
 * Two-stage job matching for one device.
 *
 * 1. Filters, then vectors: the preferences (country, city, work type) and the CV's role group are
 *    hard SQL filters; pgvector then orders what's left by cosine distance to the CV's embedding
 *    and keeps the top `CANDIDATE_LIMIT`.
 * 2. The LLM explains each of those — score, whyMatch, gaps — in Egyptian Arabic.
 *
 * Stage 2 is cached per device and job (`job_match_explanations`), fingerprinted by the CV: opening
 * the screen again, or changing preferences so a job reappears, costs no LLM call; only jobs never
 * explained for this CV version are sent, and results come back as soon as the first batch is
 * explained (`status: "searching"` until the rest are in). A CV change invalidates the lot (see
 * `ensureProfile`). Ranking is deterministic, in code: by score, the exact role breaking ties.
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  /** One match computation per device at a time — a double-tap or a retry waits for the first run and then finds everything cached, instead of paying the LLM twice. */
  private readonly inFlight = new Map<string, Promise<unknown>>();
  /** The background LLM run explaining a device's not-yet-explained jobs, if one is going. */
  private readonly explaining = new Map<string, Promise<void>>();

  constructor(
    private readonly cvService: CvService,
    private readonly jobsService: JobsService,
    private readonly preferencesService: PreferencesService,
    private readonly matchingRepository: MatchingRepository,
    private readonly jobMatchService: JobMatchService,
    private readonly applicationsService: ApplicationsService,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddings: EmbeddingProvider,
  ) {}

  getMatches(device: Device): Promise<JobMatchesResponseDto> {
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

  private async computeMatches(device: Device): Promise<JobMatchesResponseDto> {
    const preferences = await this.preferencesService.getForDevice(device);
    const candidate = await this.loadCandidate(device.id);
    const targetRole = await this.jobsService.resolveTargetRole(candidate.title, candidate.pastTitles);

    const isWorldwide = preferences.country === WORLDWIDE;
    const country = TARGET_COUNTRIES.find((code) => code === preferences.country) ?? null;
    if (!isWorldwide && !country) {
      // A country this app doesn't source jobs for yet — nothing to search, and nothing to fetch.
      return { status: 'ready', preferences, jobs: [] };
    }

    const status = await this.requestIngestion(targetRole, country);
    await this.jobsService.enrichPendingJobs(country ? [country] : null);

    const profile = await this.ensureProfile(device.id, candidate, targetRole);
    const similar = await this.jobsService.searchSimilarJobs(
      profile.embedding,
      {
        countries: country ? [country] : null,
        workTypes: preferences.workTypes,
        city: country ? preferences.city : null,
        group: targetRole?.group ?? null,
      },
      CANDIDATE_LIMIT,
    );
    if (!similar.length) {
      return { status, preferences, jobs: [] };
    }

    const similarity = new Map(similar.map((row) => [row.id, row.similarity]));
    const found = (await this.jobsService.findJobsByIds(similar.map((row) => row.id)))
      // The market isn't the job's country: a listing located elsewhere (an Austrian job from the German feed) never shows.
      .filter((job) => isInMarket(job.country, job.location))
      // Closest first, so the first batch the LLM explains is the most promising one.
      .sort((a, b) => (similarity.get(b.id) ?? 0) - (similarity.get(a.id) ?? 0));
    const applications = await this.applicationsService.findForJobs(device.id, found.map((job) => job.id));
    // The same job posted for several cities is one card — explained (and paid for) once.
    const { jobs, locations } = collapseDuplicates(found, applications);
    const { explanations, pending } = await this.explain(device.id, profile.hash, candidate, jobs);

    const matched = jobs
      // A job the model gave no reason for is one it judged a non-fit — never shown, even if its score slipped above the floor.
      .filter((job) => {
        const explanation = explanations.get(job.id);
        return !!explanation && explanation.match >= MIN_MATCH && explanation.whyMatch.length > 0;
      })
      .map((job) => toMatchedJobDto(job, explanations.get(job.id)!, roleMatchFor(job, targetRole), applications.get(job.id) ?? null, locations.get(job.id) ?? []))
      // By score, as the app's list says ("مرتبة حسب التطابق") — the score already weighs how close the
      // role is. Exact role only breaks ties, then vector similarity.
      .sort(
        (a, b) =>
          b.match - a.match ||
          ROLE_MATCH_RANK[a.roleMatch] - ROLE_MATCH_RANK[b.roleMatch] ||
          (similarity.get(b.id) ?? 0) - (similarity.get(a.id) ?? 0),
      );

    return { status: pending ? 'searching' : status, preferences, jobs: matched };
  }

  private async loadCandidate(deviceId: string): Promise<MatchCandidate> {
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

  /**
   * Demand-driven ingestion — the real trigger `JobsService.ensureRoleIngested` was built for. Only
   * queues; the background sweep is what fetches. `searching` tells the app this country's jobs for
   * the CV's role are still on their way. "Worldwide" searches what's already stored and never
   * fetches: it would mean one fetch per target country for one request.
   */
  private async requestIngestion(targetRole: RoleDefinition | null, country: TargetCountry | null): Promise<MatchesStatus> {
    if (!targetRole || !country) {
      return 'ready';
    }
    await this.jobsService.ensureRoleIngested(targetRole.code, country);
    return (await this.jobsService.getIngestionStatus(targetRole.group, country)) === 'pending' ? 'searching' : 'ready';
  }

  /** The device's CV vector — reused while the CV is unchanged, re-embedded (and the explanation cache cleared) when it isn't. */
  private async ensureProfile(deviceId: string, candidate: MatchCandidate, targetRole: RoleDefinition | null): Promise<{ hash: string; embedding: number[] }> {
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

  /**
   * Cached explanations first; only jobs never explained for this CV version go to the LLM — and the
   * answer doesn't wait for all of them. The LLM run continues in the background, saving each batch
   * as it lands; this returns as soon as the first batch is in, with `pending: true`, and the app's
   * "searching" poll picks up the rest from the cache. One background run per device at a time: a
   * poll while one is running just reads the cache instead of paying for the same jobs again.
   */
  private async explain(
    deviceId: string,
    profileHash: string,
    candidate: MatchCandidate,
    jobs: Job[],
  ): Promise<{ explanations: Map<string, { match: number; whyMatch: string[]; gaps: string[] }>; pending: boolean }> {
    const readCache = async () => {
      const rows = await this.matchingRepository.findExplanations(deviceId, profileHash, jobs.map((job) => job.id));
      return new Map(rows.map((row) => [row.jobId, { match: row.match, whyMatch: row.whyMatch, gaps: row.gaps }]));
    };
    const cached = await readCache();
    const missing = jobs.filter((job) => !cached.has(job.id));
    if (!missing.length) {
      return { explanations: cached, pending: false };
    }

    let run = this.explaining.get(deviceId);
    if (run) {
      // Someone else's poll already started it — give it a moment, then show whatever is in by now.
      await Promise.race([run, delay(FIRST_RESULTS_WAIT_MS)]);
    } else {
      let firstBatchIn: () => void = () => undefined;
      const firstBatch = new Promise<void>((resolve) => (firstBatchIn = resolve));
      run = this.jobMatchService
        .explain(
          candidate,
          missing.map((job) => ({ id: job.id, title: job.title, company: job.company, description: toPlainText(job.snippet).slice(0, MAX_DESCRIPTION_CHARS) })),
          async (explained) => {
            await this.matchingRepository.saveExplanations(deviceId, profileHash, explained);
            firstBatchIn();
          },
        )
        .then((fresh) => this.logger.log(`Explained ${fresh.size}/${missing.length} new job(s); ${cached.size} from cache.`))
        .catch((error) => this.logger.error('Job match explanation run failed', error instanceof Error ? error.stack : error))
        .finally(() => {
          this.explaining.delete(deviceId);
          firstBatchIn();
        });
      this.explaining.set(deviceId, run);
      await firstBatch;
    }

    const explanations = await readCache();
    const pending = this.explaining.has(deviceId);
    if (!explanations.size && !pending) {
      // Nothing to show that isn't unexplained — fail visibly rather than return jobs with no score.
      throw new AppError('AI_UNAVAILABLE', 'مش قادرين نقيّم الوظايف دلوقتي، جرب تاني كمان شوية', { retryable: true });
    }
    return { explanations, pending };
  }
}

function roleMatchFor(job: Job, targetRole: RoleDefinition | null): RoleMatch {
  if (!targetRole) {
    return 'related';
  }
  if (job.role === targetRole.code) {
    return 'exact';
  }
  return job.group === targetRole.group ? 'adjacent' : 'related';
}

function toMatchedJobDto(
  job: Job,
  explanation: { match: number; whyMatch: string[]; gaps: string[] },
  roleMatch: RoleMatch,
  application: MatchedJobDto['application'],
  locations: string[],
): MatchedJobDto {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    locations: locations.length ? locations : job.location ? [job.location] : [],
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
