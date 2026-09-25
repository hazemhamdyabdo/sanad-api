import type { UploadStatus } from '../../../common/types/contract.js';
import { UPLOAD_STAGES } from './upload-stage.js';

/** `POST /cv/uploads`'s `202` response — see API-CONTRACT.md §4. */
export interface UploadResponseDto {
  uploadId: string;
  status: UploadStatus;
  stages: typeof UPLOAD_STAGES;
}
