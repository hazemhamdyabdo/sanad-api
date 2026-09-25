import type { UploadStatus } from '../../../common/types/contract.js';
import { UPLOAD_STAGES } from './upload-stage.js';
export interface UploadResponseDto {
    uploadId: string;
    status: UploadStatus;
    stages: typeof UPLOAD_STAGES;
}
