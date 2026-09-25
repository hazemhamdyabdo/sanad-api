import type { Response } from 'express';
import { type LlmProvider } from './integrations/llm/llm.interface.js';
export declare class LlmDebugController {
    private readonly llm;
    constructor(llm: LlmProvider);
    complete(message?: string): Promise<{
        reply: string;
    }>;
    stream(message: string | undefined, res: Response): Promise<void>;
}
