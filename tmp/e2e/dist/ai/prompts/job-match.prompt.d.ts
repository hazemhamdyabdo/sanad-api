import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
import type { MatchCandidate, MatchJob } from '../schemas/job-match.schema.js';
export declare const JOB_MATCH_MARKER = "\u0642\u064A\u0651\u0645 \u0645\u062F\u0649 \u0645\u0646\u0627\u0633\u0628\u0629 \u0627\u0644\u0648\u0638\u0627\u064A\u0641";
export declare const JOB_MATCH_JOBS_HEADER = "\u0627\u0644\u0648\u0638\u0627\u064A\u0641:";
export declare const JOB_MATCH_PROMPT_VERSION = "v8";
export declare function buildJobMatchPrompt(candidate: MatchCandidate, jobs: MatchJob[]): LlmMessage[];
