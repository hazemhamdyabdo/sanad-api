import { Inject, Injectable, Logger } from '@nestjs/common';
import { CvAnalysisService } from '../../ai/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { generateId } from '../../common/ids.js';
import { STORAGE_PROVIDER, type StorageProvider } from '../../integrations/storage/storage.interface.js';
import { CvService } from '../cv/index.js';
import { UPLOAD_STAGES } from './dto/upload-stage.js';
import type { UploadResponseDto } from './dto/upload-response.dto.js';
import type { UploadStatusResponseDto } from './dto/upload-status-response.dto.js';
import type { Upload } from './entities/upload.entity.js';
import { UploadRepository } from './upload.repository.js';
import type { UploadedFile } from './uploaded-file.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Backstop only, not the normal-path lifetime — see `Upload`'s own doc comment. A job that hasn't finished within a day is stuck, not slow. */
const STUCK_UPLOAD_TIMEOUT_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly cvAnalysisService: CvAnalysisService,
    private readonly cvService: CvService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async create(deviceId: string, file: UploadedFile | undefined): Promise<UploadResponseDto> {
    if (!file || file.size === 0) {
      throw new AppError('INVALID_REQUEST', 'مفيش ملف اتبعت، اختار ملف تاني', { retryable: false });
    }
    if (!isPdf(file)) {
      throw new AppError('UNSUPPORTED_FILE', 'لازم يكون الملف PDF', { retryable: false });
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
      error: null,
      expiresAt: new Date(Date.now() + STUCK_UPLOAD_TIMEOUT_MS),
    });

    // Deliberately not awaited — POST /cv/uploads returns 202 immediately per the contract, and the
    // client polls GET /cv/uploads/:uploadId for progress. Errors are caught and recorded on the
    // Upload row inside processUpload itself; this catch is only for something processUpload
    // couldn't itself write down (e.g. the very first DB read failing).
    void this.processUpload(upload.id).catch((error) => {
      this.logger.error(`Unexpected error processing upload ${upload.id}`, error instanceof Error ? error.stack : error);
    });

    return { uploadId: upload.id, status: upload.status, stages: UPLOAD_STAGES };
  }

  async getStatus(uploadId: string, deviceId: string): Promise<UploadStatusResponseDto> {
    const upload = await this.getOwnedUpload(uploadId, deviceId);
    const analysis = upload.status === 'done' ? await this.cvService.getAnalysisForUpload(uploadId, deviceId) : null;

    return {
      uploadId: upload.id,
      status: upload.status,
      currentStage: upload.currentStage,
      analysis,
      error:
        upload.status === 'failed'
          ? { code: 'PARSING_FAILED', message: 'معرفناش نقرا الـ CV ده، جرّب ملف PDF تاني', retryable: true }
          : null,
    };
  }

  async getCompletedAnalysis(uploadId: string, deviceId: string): Promise<NonNullable<UploadStatusResponseDto['analysis']>> {
    const upload = await this.getOwnedUpload(uploadId, deviceId);
    if (upload.status !== 'done') {
      throw new AppError('INVALID_REQUEST', 'استنى لحد ما تحليل الـ CV يخلص', { retryable: upload.status === 'parsing' });
    }
    const analysis = await this.cvService.getAnalysisForUpload(uploadId, deviceId);
    if (!analysis) {
      throw new AppError('PARSING_FAILED', 'تحليل الـ CV مش موجود، ارفع الملف تاني', { retryable: true });
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

      const pdf = await this.storage.read(upload.filePath);
      const outcome = await this.cvAnalysisService.analyze(pdf, upload.mimeType);

      if (!outcome.success) {
        upload.status = 'failed';
        upload.error = 'CV analysis failed after every retry';
        await this.uploadRepository.save(upload);
        return;
      }

      upload.currentStage = 'checking';
      await this.cvService.saveAnalysis(upload.deviceId, upload.id, outcome.data);

      upload.status = 'done';
      await this.uploadRepository.save(upload);
    } catch (error) {
      upload.status = 'failed';
      upload.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`Upload ${uploadId} processing failed`, error instanceof Error ? error.stack : error);
      await this.uploadRepository.save(upload).catch(() => {});
    } finally {
      // The file is never needed again after this — success or failure — so it's deleted
      // immediately rather than lingering until `expiresAt`. See `Upload`'s doc comment.
      await this.storage.delete(upload.filePath);
    }
  }

  private async getOwnedUpload(uploadId: string, deviceId: string): Promise<Upload> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload || upload.deviceId !== deviceId) {
      throw new AppError('NOT_FOUND', 'مفيش ملف اترفع بالمعرف ده', { retryable: false });
    }
    return upload;
  }
}

function isPdf(file: UploadedFile): boolean {
  return file.mimetype.toLowerCase() === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
}

export { MAX_UPLOAD_BYTES };
