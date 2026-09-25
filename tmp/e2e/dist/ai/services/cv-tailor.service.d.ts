import { type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { type TailorCvInput, type TailorJobInput, type TailoredCvContent } from '../schemas/cv-tailor.schema.js';
export declare class CvTailorService {
    private readonly llm;
    private readonly logger;
    constructor(llm: LlmProvider);
    tailor(cv: TailorCvInput, job: TailorJobInput): Promise<TailoredCvContent>;
}
