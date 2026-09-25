var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UploadService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CvAnalysisService } from '../../ai/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { generateId } from '../../common/ids.js';
import { STORAGE_PROVIDER } from '../../integrations/storage/storage.interface.js';
import { CvService } from '../cv/index.js';
import { UPLOAD_STAGES } from './dto/upload-stage.js';
import { UploadRepository } from './upload.repository.js';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const STUCK_UPLOAD_TIMEOUT_MS = 24 * 60 * 60 * 1000;
let UploadService = UploadService_1 = class UploadService {
    uploadRepository;
    cvAnalysisService;
    cvService;
    storage;
    logger = new Logger(UploadService_1.name);
    constructor(uploadRepository, cvAnalysisService, cvService, storage) {
        this.uploadRepository = uploadRepository;
        this.cvAnalysisService = cvAnalysisService;
        this.cvService = cvService;
        this.storage = storage;
    }
    async create(deviceId, file) {
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
        void this.processUpload(upload.id).catch((error) => {
            this.logger.error(`Unexpected error processing upload ${upload.id}`, error instanceof Error ? error.stack : error);
        });
        return { uploadId: upload.id, status: upload.status, stages: UPLOAD_STAGES };
    }
    async getStatus(uploadId, deviceId) {
        const upload = await this.getOwnedUpload(uploadId, deviceId);
        const analysis = upload.status === 'done' ? await this.cvService.getAnalysisForUpload(uploadId, deviceId) : null;
        return {
            uploadId: upload.id,
            status: upload.status,
            currentStage: upload.currentStage,
            analysis,
            error: upload.status === 'failed'
                ? { code: 'PARSING_FAILED', message: 'معرفناش نقرا الـ CV ده، جرّب ملف PDF تاني', retryable: true }
                : null,
        };
    }
    async getCompletedAnalysis(uploadId, deviceId) {
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
    async processUpload(uploadId) {
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
        }
        catch (error) {
            upload.status = 'failed';
            upload.error = error instanceof Error ? error.message : String(error);
            this.logger.error(`Upload ${uploadId} processing failed`, error instanceof Error ? error.stack : error);
            await this.uploadRepository.save(upload).catch(() => { });
        }
        finally {
            await this.storage.delete(upload.filePath);
        }
    }
    async getOwnedUpload(uploadId, deviceId) {
        const upload = await this.uploadRepository.findById(uploadId);
        if (!upload || upload.deviceId !== deviceId) {
            throw new AppError('NOT_FOUND', 'مفيش ملف اترفع بالمعرف ده', { retryable: false });
        }
        return upload;
    }
};
UploadService = UploadService_1 = __decorate([
    Injectable(),
    __param(3, Inject(STORAGE_PROVIDER)),
    __metadata("design:paramtypes", [UploadRepository,
        CvAnalysisService,
        CvService, Object])
], UploadService);
export { UploadService };
function isPdf(file) {
    return file.mimetype.toLowerCase() === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
}
export { MAX_UPLOAD_BYTES };
//# sourceMappingURL=upload.service.js.map