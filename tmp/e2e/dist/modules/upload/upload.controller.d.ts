import type { Device } from '../device/index.js';
import type { UploadResponseDto } from './dto/upload-response.dto.js';
import type { UploadStatusResponseDto } from './dto/upload-status-response.dto.js';
import { UploadService } from './upload.service.js';
import type { UploadedFile } from './uploaded-file.js';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    create(device: Device, file: UploadedFile | undefined): Promise<UploadResponseDto>;
    getStatus(device: Device, uploadId: string): Promise<UploadStatusResponseDto>;
}
