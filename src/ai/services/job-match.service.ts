import { Inject, Injectable, Logger } from '@nestjs/common';
import { delay } from '../../common/delay.js';
import { EXTRACTION_LLM_PROVIDER, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildJobMatchPrompt } from '../prompts/job-match.prompt.js';
import { jobMatchEnvelopeSchema, jobMatchItemSchema, type JobMatchExplanation, type MatchCandidate, type MatchJob } from '../schemas/job-match.schema.js';

/** Small batches keep each reply short (fast, and less for the model to drop), and let several run at once. */
const BATCH_SIZE = 7;
/** 4 × 7 covers matching's 25 candidates in one parallel round. */
const MAX_CONCURRENT_BATCHES = 4;
/** Each retry only re-asks for the jobs still missing a valid explanation. */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_500;
const MATCH_MAX_TOKENS = 3_000;

const YEARS_WORD = /سنة|سنين|سنوات|سنه|year/i;

/**
 * Drops "needs N years" gaps the candidate already meets — the model keeps flagging a 3-year
 * candidate on a "0-2 years" listing despite the prompt saying over-qualification isn't a gap, so
 * this is enforced in code rather than trusted. A years gap is kept only when its lowest number
 * (the requirement's minimum) is above the candidate's years. Unknown years: nothing is dropped.
 */
function dropMetYearsGaps(gaps: string[], candidateYears: number | null): string[] {
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

/** Same idea for seniority: a mid/senior candidate on a junior listing is over-qualified, not missing something ("مطلوب دور Junior"). */
function dropJuniorGaps(gaps: string[], seniority: MatchCandidate['seniority']): string[] {
  return seniority === 'mid' || seniority === 'senior' ? gaps.filter((gap) => !JUNIOR_WORD.test(gap)) : gaps;
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  return start === -1 || end < start ? trimmed : trimmed.slice(start, end + 1);
}

/**
 * Stage two of matching: explains each job the vector search picked — `match` score, `whyMatch`
 * and `gaps` in Egyptian Arabic. Every item is validated on its own; a job the model skipped,
 * duplicated, or answered in the wrong shape/language is re-asked (alone with the other missing
 * ones), never passed through. Jobs still unexplained after every attempt are simply absent from
 * the returned map — the caller decides what an incomplete result means.
 */
@Injectable()
export class JobMatchService {
  private readonly logger = new Logger(JobMatchService.name);

  constructor(@Inject(EXTRACTION_LLM_PROVIDER) private readonly llm: LlmProvider) {}

  /**
   * `onBatch` is called as each batch finishes (in completion order), so a caller can show the first
   * results while the rest are still being explained. Batches are taken in the order given — put the
   * most promising jobs first.
   */
  async explain(candidate: MatchCandidate, jobs: MatchJob[], onBatch?: (explained: JobMatchExplanation[]) => Promise<void>): Promise<Map<string, JobMatchExplanation>> {
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
    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_BATCHES, batches.length) }, worker));
    return results;
  }

  private async explainBatch(candidate: MatchCandidate, batch: MatchJob[]): Promise<JobMatchExplanation[]> {
    const explained = new Map<string, JobMatchExplanation>();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const missing = batch.filter((job) => !explained.has(job.id));
      if (!missing.length) {
        break;
      }
      if (attempt > 0) {
        await delay(RETRY_BASE_DELAY_MS * attempt);
      }

      let raw: string;
      try {
        raw = await this.llm.complete({ messages: buildJobMatchPrompt(candidate, missing), temperature: 0, jsonMode: true, maxTokens: MATCH_MAX_TOKENS });
      } catch (error) {
        // Rate limits and transient network errors land here — worth another try after the delay.
        this.logger.warn(`Job match call failed on attempt ${attempt + 1}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonObject(raw));
      } catch {
        this.logger.warn(`Job match output was not valid JSON on attempt ${attempt + 1}.`);
        continue;
      }
      const envelope = jobMatchEnvelopeSchema.safeParse(parsed);
      if (!envelope.success) {
        this.logger.warn(`Job match output had no "matches" array on attempt ${attempt + 1}.`);
        continue;
      }

      const wanted = new Set(missing.map((job) => job.id));
      const rejections: string[] = [];
      for (const item of envelope.data.matches) {
        const result = jobMatchItemSchema.safeParse(item);
        if (result.success && wanted.has(result.data.jobId) && !explained.has(result.data.jobId)) {
          explained.set(result.data.jobId, { ...result.data, gaps: dropJuniorGaps(dropMetYearsGaps(result.data.gaps, candidate.yearsOfExperience), candidate.seniority) });
        } else {
          // Paths and rule names only — never the item's text.
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
}
