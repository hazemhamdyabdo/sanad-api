import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
import type { TailorCvInput, TailorJobInput } from '../schemas/cv-tailor.schema.js';
export declare const CV_TAILOR_MARKER = "Tailor this CV to one job listing";
export declare const CV_TAILOR_JOB_HEADER = "JOB LISTING:";
export declare function buildCvTailorPrompt(cv: TailorCvInput, job: TailorJobInput): LlmMessage[];
