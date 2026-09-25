import type { ApplyMethod } from './entities/job.entity.js';
export declare function resolveApplyMethod(snippet: string | null): {
    method: ApplyMethod;
    email: string | null;
};
