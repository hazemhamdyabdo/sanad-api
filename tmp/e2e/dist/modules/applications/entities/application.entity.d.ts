import type { ApplicationStage, ApplicationStatus, ApplyMethod } from '../../../common/types/contract.js';
import type { CvResponseDto } from '../../cv/index.js';
export type ApplicationErrorCode = 'no_candidate_email' | 'send_failed' | 'job_unavailable' | 'internal';
export declare class Application {
    id: string;
    deviceId: string;
    jobId: string | null;
    batchId: string;
    method: ApplyMethod;
    status: ApplicationStatus;
    stage: ApplicationStage | null;
    jobTitle: string;
    company: string | null;
    location: string | null;
    listingUrl: string;
    recipientEmail: string | null;
    tailoredCv: CvResponseDto | null;
    cvTailored: boolean;
    errorCode: ApplicationErrorCode | null;
    errorDetail: string | null;
    providerMessageId: string | null;
    createdAt: Date;
    updatedAt: Date;
    sentAt: Date | null;
    preparedAt: Date | null;
    openedAt: Date | null;
    failedAt: Date | null;
}
