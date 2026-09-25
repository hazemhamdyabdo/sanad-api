import type { ApplicationBatchStatus, ApplicationStage, ApplicationStatus, ApplyMethod } from '../../../common/types/contract.js';
import type { Application } from '../entities/application.entity.js';
export interface ApplicationDto {
    id: string;
    batchId: string;
    jobId: string | null;
    job: {
        title: string;
        company: string | null;
        location: string | null;
        url: string;
        email: string | null;
    };
    method: ApplyMethod;
    status: ApplicationStatus;
    stage: ApplicationStage | null;
    cvAvailable: boolean;
    cvTailored: boolean;
    error: {
        message: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    sentAt: string | null;
    preparedAt: string | null;
    openedAt: string | null;
    failedAt: string | null;
}
export interface ApplicationBatchDto {
    batchId: string;
    status: ApplicationBatchStatus;
    progress: {
        total: number;
        completed: number;
    };
    sent: ApplicationDto[];
    prepared: ApplicationDto[];
    failed: ApplicationDto[];
    processing: ApplicationDto[];
    alreadyApplied: ApplicationDto[];
}
export declare function toApplicationDto(application: Application): ApplicationDto;
