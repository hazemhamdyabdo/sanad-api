import type { ApplicationBatchStatus } from '../../../common/types/contract.js';
export declare class ApplicationBatch {
    id: string;
    deviceId: string;
    status: ApplicationBatchStatus;
    applicationIds: string[];
    alreadyAppliedIds: string[];
    createdAt: Date;
    completedAt: Date | null;
}
