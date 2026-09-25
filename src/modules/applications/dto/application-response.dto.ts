import type { ApplicationBatchStatus, ApplicationStage, ApplicationStatus, ApplyMethod } from '../../../common/types/contract.js';
import type { Application, ApplicationErrorCode } from '../entities/application.entity.js';

/** One application — see API-CONTRACT.md §7. */
export interface ApplicationDto {
  id: string;
  batchId: string;
  jobId: string | null;
  job: { title: string; company: string | null; location: string | null; url: string; email: string | null };
  method: ApplyMethod;
  status: ApplicationStatus;
  stage: ApplicationStage | null;
  /** Whether the tailored CV (`GET /applications/:id/cv`) is ready to download. */
  cvAvailable: boolean;
  cvTailored: boolean;
  error: { message: string } | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  preparedAt: string | null;
  openedAt: string | null;
  failedAt: string | null;
}

/** `POST /applications` (202) and `GET /applications/batches/:batchId`. */
export interface ApplicationBatchDto {
  batchId: string;
  status: ApplicationBatchStatus;
  progress: { total: number; completed: number };
  sent: ApplicationDto[];
  /** `prepared` and `opened` — waiting on the user to finish on the listing site. */
  prepared: ApplicationDto[];
  failed: ApplicationDto[];
  processing: ApplicationDto[];
  /** Requested jobs this device had already applied to — not processed again. */
  alreadyApplied: ApplicationDto[];
}

const ERROR_MESSAGES: Record<ApplicationErrorCode, string> = {
  no_candidate_email: 'مفيش إيميل في الـ CV بتاعك، فالشركة مش هتعرف ترد عليك. ضيف إيميلك في الـ CV وجرب تاني.',
  send_failed: 'مقدرناش نبعت الإيميل للشركة دلوقتي، جرب تاني كمان شوية.',
  job_unavailable: 'الوظيفة دي مبقتش متاحة.',
  internal: 'حصل خطأ واحنا بنقدّم على الوظيفة دي، جرب تاني.',
};

const iso = (date: Date | null) => (date ? date.toISOString() : null);

export function toApplicationDto(application: Application): ApplicationDto {
  return {
    id: application.id,
    batchId: application.batchId,
    jobId: application.jobId,
    job: {
      title: application.jobTitle,
      company: application.company,
      location: application.location,
      url: application.listingUrl,
      email: application.recipientEmail,
    },
    method: application.method,
    status: application.status,
    stage: application.status === 'processing' ? application.stage : null,
    cvAvailable: application.tailoredCv !== null,
    cvTailored: application.cvTailored,
    error: application.status === 'failed' && application.errorCode ? { message: ERROR_MESSAGES[application.errorCode] } : null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    sentAt: iso(application.sentAt),
    preparedAt: iso(application.preparedAt),
    openedAt: iso(application.openedAt),
    failedAt: iso(application.failedAt),
  };
}
