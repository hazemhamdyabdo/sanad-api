import { type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { type JobMatchExplanation, type MatchCandidate, type MatchJob } from '../schemas/job-match.schema.js';
export declare class JobMatchService {
    private readonly llm;
    private readonly logger;
    constructor(llm: LlmProvider);
    explain(candidate: MatchCandidate, jobs: MatchJob[]): Promise<Map<string, JobMatchExplanation>>;
    private explainBatch;
}
