import { Inject, Injectable, Logger } from '@nestjs/common';
import { CvAnalysisService } from '../../ai/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { generateId } from '../../common/ids.js';
import { isTimeoutError, withTimeout } from '../../common/timeout.js';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../integrations/storage/storage.interface.js';
import { CvService } from '../cv/index.js';
import { UPLOAD_STAGES } from './dto/upload-stage.js';
import type { UploadResponseDto } from './dto/upload-response.dto.js';
import type { UploadStatusResponseDto } from './dto/upload-status-response.dto.js';
import type { Upload, UploadErrorCode } from './entities/upload.entity.js';
import { UploadRepository } from './upload.repository.js';
import type { UploadedFile } from './uploaded-file.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Backstop only, not the normal-path lifetime — see `Upload`'s own doc comment. A row that hasn't been purged within a day is a leak, not a slow job. */
const STUCK_UPLOAD_TIMEOUT_MS = 24 * 60 * 60 * 1000;
/**
 * The whole analysis — reading the file, the model call(s), saving — must finish within this, or the
 * upload is marked `failed` with a "took too long" message. Comfortably above one model call's own
 * timeout (`CvAnalysisService`) plus a couple of quick validation retries; the app polls for about
 * this long before giving up on its side too, so the two agree on what "too long" means.
 */
const ANALYSIS_TIMEOUT_MS = 170_000;
/**
 * A row still `parsing` this long after it was created can't have an analysis running any more
 * (`ANALYSIS_TIMEOUT_MS` would have ended it) — the API restarted mid-way. Reported as failed the
 * next time the app asks, instead of "parsing" until the day-old cleanup deletes it.
 */
const INTERRUPTED_AFTER_MS = 5 * 60 * 1000;

/** Egyptian Arabic, shown by the app as is. Every one of these is worth another try, so `retryable` is always true. */
const FAILURE_MESSAGES: Record<UploadErrorCode, string> = {
  unreadable: 'معرفناش نقرا الـ CV ده، جرّب ملف PDF تاني',
  timeout: 'تحليل الـ CV أخد وقت أطول من اللازم، جرّب ترفعه تاني',
  interrupted: 'حصلت مشكلة عندنا والتحليل وقف في النص، جرّب ترفع الملف تاني',
  internal: 'حصلت مشكلة عندنا واحنا بنحلل الـ CV، جرّب تاني كمان شوية',
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly cvAnalysisService: CvAnalysisService,
    private readonly cvService: CvService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async create(
    deviceId: string,
    file: UploadedFile | undefined,
  ): Promise<UploadResponseDto> {
    if (!file || file.size === 0) {
      throw new AppError('INVALID_REQUEST', 'مفيش ملف اتبعت، اختار ملف تاني', {
        retryable: false,
      });
    }
    if (!isPdf(file)) {
      throw new AppError('UNSUPPORTED_FILE', 'لازم يكون الملف PDF', {
        retryable: false,
      });
    }

    const filePath = await this.storage.save(file.buffer, file.originalname);
    const upload = await this.uploadRepository.create({
      id: generateId('upl'),
      deviceId,
      status: 'parsing',
      currentStage: UPLOAD_STAGES[0].key,
      filePath,
      originalFileName: file.originalname,
      mimeType: 'application/pdf',
      errorCode: null,
      error: null,
      expiresAt: new Date(Date.now() + STUCK_UPLOAD_TIMEOUT_MS),
    });

    // Deliberately not awaited — POST /cv/uploads returns 202 immediately per the contract, and the
    // client polls GET /cv/uploads/:uploadId for progress. Errors are caught and recorded on the
    // Upload row inside processUpload itself; this catch is only for something processUpload
    // couldn't itself write down (e.g. the very first DB read failing).
    void this.processUpload(upload.id).catch((error) => {
      this.logger.error(
        `Unexpected error processing upload ${upload.id}`,
        error instanceof Error ? error.stack : error,
      );
    });

    return {
      uploadId: upload.id,
      status: upload.status,
      stages: UPLOAD_STAGES,
    };
  }

  async getStatus(
    uploadId: string,
    deviceId: string,
  ): Promise<UploadStatusResponseDto> {
    const upload = await this.getOwnedUpload(uploadId, deviceId);
    if (
      upload.status === 'parsing' &&
      Date.now() - upload.createdAt.getTime() > INTERRUPTED_AFTER_MS
    ) {
      // Slow and dead must look different to the app — this one is dead.
      this.logger.warn(
        `Upload ${uploadId} was still parsing ${Math.round(INTERRUPTED_AFTER_MS / 60_000)} minutes after creation — reporting it failed.`,
      );
      await this.markFailed(
        upload,
        'interrupted',
        'Still parsing long after any analysis could be running (API restart?)',
      );
    }
    const analysis =
      upload.status === 'done'
        ? await this.cvService.getAnalysisForUpload(uploadId, deviceId)
        : null;

    return {
      uploadId: upload.id,
      status: upload.status,
      currentStage: upload.currentStage,
      analysis,
      error:
        upload.status === 'failed'
          ? {
              code: 'PARSING_FAILED',
              message: FAILURE_MESSAGES[upload.errorCode ?? 'internal'],
              retryable: true,
            }
          : null,
    };
  }

  async getCompletedAnalysis(
    uploadId: string,
    deviceId: string,
  ): Promise<NonNullable<UploadStatusResponseDto['analysis']>> {
    const upload = await this.getOwnedUpload(uploadId, deviceId);
    if (upload.status !== 'done') {
      throw new AppError('INVALID_REQUEST', 'استنى لحد ما تحليل الـ CV يخلص', {
        retryable: upload.status === 'parsing',
      });
    }
    const analysis = await this.cvService.getAnalysisForUpload(
      uploadId,
      deviceId,
    );
    if (!analysis) {
      throw new AppError(
        'PARSING_FAILED',
        'تحليل الـ CV مش موجود، ارفع الملف تاني',
        { retryable: true },
      );
    }
    return analysis;
  }

  private async processUpload(uploadId: string): Promise<void> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload) {
      return;
    }

    try {
      upload.currentStage = 'analyzing';
      await this.uploadRepository.save(upload);

      // Everything after this point is bounded: a hung model call ends as a `failed` upload the app
      // can act on, never a `parsing` one it keeps polling. A result that lands after the deadline
      // is discarded — the row already says failed, and the user has been told to try again.
      const outcome = await withTimeout(
        (async () => {
          const pdf = await this.storage.read(upload.filePath);
          return this.cvAnalysisService.analyze(pdf, upload.mimeType);
        })(),
        ANALYSIS_TIMEOUT_MS,
        `CV analysis for upload ${uploadId}`,
      );

      if (!outcome.success) {
        await this.markFailed(
          upload,
          'unreadable',
          'CV analysis produced no valid result after every retry',
        );
        return;
      }

      upload.currentStage = 'checking';
      await this.cvService.saveAnalysis(
        upload.deviceId,
        upload.id,
        outcome.data,
      );

      upload.status = 'done';
      await this.uploadRepository.save(upload);
    } catch (error) {
      const code: UploadErrorCode = isTimeoutError(error)
        ? 'timeout'
        : 'internal';
      this.logger.error(
        `Upload ${uploadId} processing failed (${code})`,
        error instanceof Error ? error.stack : error,
      );
      await this.markFailed(
        upload,
        code,
        error instanceof Error ? error.message : String(error),
      ).catch(() => {});
    } finally {
      // The file is never needed again after this — success or failure — so it's deleted
      // immediately rather than lingering until `expiresAt`. See `Upload`'s doc comment.
      await this.storage.delete(upload.filePath);
    }
  }

  private async markFailed(
    upload: Upload,
    code: UploadErrorCode,
    detail: string,
  ): Promise<void> {
    upload.status = 'failed';
    upload.errorCode = code;
    upload.error = detail.slice(0, 2_000);
    await this.uploadRepository.save(upload);
  }

  private async getOwnedUpload(
    uploadId: string,
    deviceId: string,
  ): Promise<Upload> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload || upload.deviceId !== deviceId) {
      throw new AppError('NOT_FOUND', 'مفيش ملف اترفع بالمعرف ده', {
        retryable: false,
      });
    }
    return upload;
  }
}

function isPdf(file: UploadedFile): boolean {
  return (
    file.mimetype.toLowerCase() === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf')
  );
}

export { MAX_UPLOAD_BYTES };
