import { CvAnalysisService } from '../../ai/index.js';
import { type StorageProvider } from '../../integrations/storage/storage.interface.js';
import { CvService } from '../cv/index.js';
import type { UploadResponseDto } from './dto/upload-response.dto.js';
import type { UploadStatusResponseDto } from './dto/upload-status-response.dto.js';
import { UploadRepository } from './upload.repository.js';
import type { UploadedFile } from './uploaded-file.js';
declare const MAX_UPLOAD_BYTES: number;
export declare class UploadService {
    private readonly uploadRepository;
    private readonly cvAnalysisService;
    private readonly cvService;
    private readonly storage;
    private readonly logger;
    constructor(uploadRepository: UploadRepository, cvAnalysisService: CvAnalysisService, cvService: CvService, storage: StorageProvider);
    create(deviceId: string, file: UploadedFile | undefined): Promise<UploadResponseDto>;
    getStatus(uploadId: string, deviceId: string): Promise<UploadStatusResponseDto>;
    getCompletedAnalysis(uploadId: string, deviceId: string): Promise<NonNullable<UploadStatusResponseDto['analysis']>>;
    private processUpload;
    private getOwnedUpload;
}
export { MAX_UPLOAD_BYTES };
