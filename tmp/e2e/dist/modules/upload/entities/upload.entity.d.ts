import type { UploadStatus } from '../../../common/types/contract.js';
export declare class Upload {
    id: string;
    deviceId: string;
    status: UploadStatus;
    currentStage: string | null;
    filePath: string;
    originalFileName: string;
    mimeType: string;
    error: string | null;
    createdAt: Date;
    expiresAt: Date;
}
