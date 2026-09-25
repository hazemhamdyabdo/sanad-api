import { type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { type CvAnalysisResult } from '../schemas/cv-analysis.schema.js';
export type CvAnalysisOutcome = {
    success: true;
    data: CvAnalysisResult;
} | {
    success: false;
};
export declare class CvAnalysisService {
    private readonly llm;
    private readonly logger;
    constructor(llm: LlmProvider);
    analyze(pdf: Buffer, mimeType: string): Promise<CvAnalysisOutcome>;
    private withConfidence;
}
