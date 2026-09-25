import type { UploadStatus } from '../../../common/types/contract.js';
import type { CvAnalysisResponseDto } from '../../cv/index.js';

/** `GET /cv/uploads/:uploadId` — see API-CONTRACT.md §4. `analysis` is present only once `status: "done"`. */
export interface UploadStatusResponseDto {
  uploadId: string;
  status: UploadStatus;
  currentStage: string | null;
  analysis: CvAnalysisResponseDto | null;
  error: { code: 'PARSING_FAILED'; message: string; retryable: boolean } | null;
}
