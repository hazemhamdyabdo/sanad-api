import { Inject, Injectable, Logger } from '@nestjs/common';
import { delay } from '../../common/delay.js';
import {
  EXTRACTION_LLM_PROVIDER,
  type LlmMessage,
  type LlmProvider,
} from '../../integrations/llm/llm.interface.js';
import { buildJobMatchPrompt } from '../prompts/job-match.prompt.js';
import {
  isArabicLine,
  jobMatchEnvelopeSchema,
  jobMatchItemSchema,
  type JobMatchExplanation,
  type MatchCandidate,
  type MatchJob,
} from '../schemas/job-match.schema.js';
import { candidateFactsText, isTraceableReason } from './why-match-guard.js';

/** Small batches keep each reply short (fast, and less for the model to drop), and let several run at once. */
const BATCH_SIZE = 7;
/** 4 × 7 covers matching's 25 candidates in one parallel round. */
const MAX_CONCURRENT_BATCHES = 4;
/** Each retry only re-asks for the jobs still missing a valid explanation. */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_500;
const MATCH_MAX_TOKENS = 3_000;
/** One batch of 7 explains in ~12s when things are healthy; a call still open at this point is a hung one, and the retry handles it. */
const MATCH_CALL_TIMEOUT_MS = 40_000;
/**
 * First attempt is deterministic. A retry at temperature 0 with the same prompt returns the same
 * rejected reply token for token (seen in the logs: identical usage on attempts 2 and 3), so retries
 * get the previous reply plus a correction in context AND a little temperature.
 */
const RETRY_TEMPERATURE = 0.3;

const YEARS_WORD = /سنة|سنين|سنوات|سنه|year/i;

/**
 * Drops "needs N years" gaps the candidate already meets — the model keeps flagging a 3-year
 * candidate on a "0-2 years" listing despite the prompt saying over-qualification isn't a gap, so
 * this is enforced in code rather than trusted. A years gap is kept only when its lowest number
 * (the requirement's minimum) is above the candidate's years. Unknown years: nothing is dropped.
 */
function dropMetYearsGaps(
  gaps: string[],
  candidateYears: number | null,
): string[] {
  if (candidateYears === null) {
    return gaps;
  }
  return gaps.filter((gap) => {
    if (!YEARS_WORD.test(gap)) {
      return true;
    }
    const western = gap.replace(/[٠-٩]/g, (digit) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)),
    );
    const numbers = (western.match(/\d+(\.\d+)?/g) ?? []).map(Number);
    return !numbers.length || Math.min(...numbers) > candidateYears;
  });
}

const JUNIOR_WORD = /junior|entry[\s-]?level|جونيور|مبتدئ/i;

/** Same idea for seniority: a mid/senior candidate on a junior listing is over-qualified, not missing something ("مطلوب دور Junior"). */
function dropJuniorGaps(
  gaps: string[],
  seniority: MatchCandidate['seniority'],
): string[] {
  return seniority === 'mid' || seniority === 'senior'
    ? gaps.filter((gap) => !JUNIOR_WORD.test(gap))
    : gaps;
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  return start === -1 || end < start ? trimmed : trimmed.slice(start, end + 1);
}

/** Rule names only (never the item's text) — logged, and turned into the retry's correction message. */
const REJECTION_LANGUAGE = 'whyMatch: must be Egyptian Arabic';
const REJECTION_JOB_ID = 'unknown or duplicate jobId';
const REJECTION_SHAPE = 'not a JSON object with a "matches" array';
const KNOWN_REJECTIONS: string[] = [
  REJECTION_SHAPE,
  REJECTION_LANGUAGE,
  REJECTION_JOB_ID,
];

/** What the previous attempt got wrong, so the model fixes that instead of repeating it. Egyptian Arabic, like the prompt. */
function buildCorrection(rejections: Set<string>, missing: MatchJob[]): string {
  const points: string[] = [];
  if (rejections.has(REJECTION_SHAPE)) {
    points.push(
      'الرد لازم يكون كائن JSON واحد فيه "matches" بالشكل المطلوب، من غير أي نص قبله أو بعده.',
    );
  }
  if (rejections.has(REJECTION_LANGUAGE)) {
    points.push(
      'في أسباب أو نواقص مكتوبة بالإنجليزي بالكامل. كل سطر في "whyMatch" و"gaps" لازم يكون جملة بالمصري بحروف عربي — اسم المهارة بالإنجليزي جوه الجملة عادي ("خبرة Python و SQL")، بس سطر كله إنجليزي ("Python, SQL") مرفوض.',
    );
  }
  if (rejections.has(REJECTION_JOB_ID)) {
    points.push(
      'كل "jobId" من القايمة لازم يظهر مرة واحدة بالظبط، بنفس الـ id المكتوب، ومن غير وظايف مش في القايمة.',
    );
  }
  if (
    [...rejections].some((rejection) => !KNOWN_REJECTIONS.includes(rejection))
  ) {
    points.push(
      'في عناصر مش مطابقة للشكل المطلوب: "match" رقم من 0 لـ 100، و"whyMatch" و"gaps" قوايم سطور قصيرة (من 2 لـ 120 حرف).',
    );
  }
  if (!points.length) {
    points.push('في وظايف من القايمة مش موجودة في الرد.');
  }
  return [
    'الرد اللي فات مرفوض:',
    ...points.map((point) => `- ${point}`),
    `رجّع JSON بنفس الشكل للوظايف دي بس: ${missing.map((job) => job.id).join(', ')}.`,
  ].join('\n');
}

/**
 * Stage two of matching: explains each job the vector search picked — `match` score, `whyMatch`
 * and `gaps` in Egyptian Arabic. Every item is validated on its own; a job the model skipped,
 * duplicated, or answered in the wrong shape/language is re-asked (alone with the other missing
 * ones), never passed through. Jobs still unexplained after every attempt are simply absent from
 * the returned map — the caller decides what an incomplete result means.
 *
 * Language is enforced per line, in code: an English line among Arabic ones is dropped and the job
 * kept; a job whose reasons are all English is rejected and re-asked, because passing it through
 * with no reasons would cache it as a non-fit.
 */
@Injectable()
export class JobMatchService {
  private readonly logger = new Logger(JobMatchService.name);

  constructor(
    @Inject(EXTRACTION_LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  /**
   * `onBatch` is called as each batch finishes (in completion order), so a caller can show the first
   * results while the rest are still being explained. Batches are taken in the order given — put the
   * most promising jobs first.
   */
  async explain(
    candidate: MatchCandidate,
    jobs: MatchJob[],
    onBatch?: (explained: JobMatchExplanation[]) => Promise<void>,
  ): Promise<Map<string, JobMatchExplanation>> {
    const batches: MatchJob[][] = [];
    for (let start = 0; start < jobs.length; start += BATCH_SIZE) {
      batches.push(jobs.slice(start, start + BATCH_SIZE));
    }

    const results = new Map<string, JobMatchExplanation>();
    let next = 0;
    const worker = async (): Promise<void> => {
      while (next < batches.length) {
        const batch = batches[next++];
        const explained = await this.explainBatch(candidate, batch);
        for (const explanation of explained) {
          results.set(explanation.jobId, explanation);
        }
        await onBatch?.(explained);
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.min(MAX_CONCURRENT_BATCHES, batches.length) },
        worker,
      ),
    );
    return results;
  }

  private async explainBatch(
    candidate: MatchCandidate,
    batch: MatchJob[],
  ): Promise<JobMatchExplanation[]> {
    const explained = new Map<string, JobMatchExplanation>();
    const facts = candidateFactsText(candidate);
    let untracedReasons = 0;
    let englishLines = 0;
    /** The previous attempt's reply and what was wrong with it — fed back on the next attempt. */
    let previous: { raw: string; rejections: Set<string> } | null = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const missing = batch.filter((job) => !explained.has(job.id));
      if (!missing.length) {
        break;
      }
      if (attempt > 0) {
        await delay(RETRY_BASE_DELAY_MS * attempt);
      }

      const messages: LlmMessage[] = buildJobMatchPrompt(candidate, missing);
      if (previous) {
        messages.push(
          { role: 'assistant', content: previous.raw },
          {
            role: 'user',
            content: buildCorrection(previous.rejections, missing),
          },
        );
      }

      let raw: string;
      try {
        raw = await this.llm.complete({
          messages,
          temperature: previous ? RETRY_TEMPERATURE : 0,
          jsonMode: true,
          maxTokens: MATCH_MAX_TOKENS,
          timeoutMs: MATCH_CALL_TIMEOUT_MS,
        });
      } catch (error) {
        // Rate limits and transient network errors land here — worth another try after the delay.
        this.logger.warn(
          `Job match call failed on attempt ${attempt + 1}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonObject(raw));
      } catch {
        this.logger.warn(
          `Job match output was not valid JSON on attempt ${attempt + 1}.`,
        );
        previous = { raw, rejections: new Set([REJECTION_SHAPE]) };
        continue;
      }
      const envelope = jobMatchEnvelopeSchema.safeParse(parsed);
      if (!envelope.success) {
        this.logger.warn(
          `Job match output had no "matches" array on attempt ${attempt + 1}.`,
        );
        previous = { raw, rejections: new Set([REJECTION_SHAPE]) };
        continue;
      }

      const wanted = new Set(missing.map((job) => job.id));
      const rejections: string[] = [];
      for (const item of envelope.data.matches) {
        const result = jobMatchItemSchema.safeParse(item);
        if (!result.success) {
          // Paths and rule names only — never the item's text.
          rejections.push(
            result.error.issues
              .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
              .join(', '),
          );
          continue;
        }
        if (
          !wanted.has(result.data.jobId) ||
          explained.has(result.data.jobId)
        ) {
          rejections.push(REJECTION_JOB_ID);
          continue;
        }

        // Every user-facing line is Egyptian Arabic. Stray English lines are dropped; a job with
        // reasons but none in Arabic is re-asked rather than cached as reason-less (a non-fit).
        const arabicWhyMatch = result.data.whyMatch.filter(isArabicLine);
        if (result.data.whyMatch.length && !arabicWhyMatch.length) {
          rejections.push(REJECTION_LANGUAGE);
          continue;
        }
        const arabicGaps = result.data.gaps.filter(isArabicLine);
        englishLines +=
          result.data.whyMatch.length -
          arabicWhyMatch.length +
          (result.data.gaps.length - arabicGaps.length);

        // A reason whose facts aren't in the candidate's data is dropped, never shown (see why-match-guard.ts).
        // A job left with no reason at all is a non-fit, which matching already hides.
        const whyMatch = arabicWhyMatch.filter((line) =>
          isTraceableReason(line, facts, candidate.yearsOfExperience),
        );
        untracedReasons += arabicWhyMatch.length - whyMatch.length;
        explained.set(result.data.jobId, {
          ...result.data,
          whyMatch,
          gaps: dropJuniorGaps(
            dropMetYearsGaps(arabicGaps, candidate.yearsOfExperience),
            candidate.seniority,
          ),
        });
      }

      const unanswered = missing.filter((job) => !explained.has(job.id)).length;
      if (rejections.length || unanswered) {
        const reasons =
          [...new Set(rejections)].join(' | ') ||
          'none (jobs missing from the reply)';
        this.logger.warn(
          `Job match attempt ${attempt + 1}: ${unanswered} of ${missing.length} job(s) still unexplained; rejected ${rejections.length} item(s) — ${reasons}`,
        );
      }
      previous = { raw, rejections: new Set(rejections) };
    }

    if (englishLines) {
      this.logger.warn(
        `Job match: dropped ${englishLines} all-English line(s) from otherwise valid explanations.`,
      );
    }
    if (untracedReasons) {
      // A count only — never the lines themselves (they'd carry CV content).
      this.logger.warn(
        `Job match: dropped ${untracedReasons} reason(s) naming something that isn't in the CV.`,
      );
    }
    const unexplained = batch.length - explained.size;
    if (unexplained) {
      this.logger.warn(
        `Job match gave up on ${unexplained} of ${batch.length} job(s) after ${MAX_ATTEMPTS} attempts.`,
      );
    }
    return [...explained.values()];
  }
}
