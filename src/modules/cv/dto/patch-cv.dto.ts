import { IsOptional } from 'class-validator';
import type { CvContact } from '../entities/cv.entity.js';

/**
 * The body's exact shape per field is validated by `cvPatchSchema` in the service — this DTO only
 * needs to keep `ValidationPipe`'s `whitelist: true` from stripping the request's per-section
 * arrays and the nested `contact` object before they ever reach that validation.
 */
export class PatchCvDto {
  @IsOptional() name?: string;
  @IsOptional() title?: string | null;
  @IsOptional() contact?: CvContact;
  @IsOptional() summary?: string | null;
  @IsOptional() experience?: unknown[];
  @IsOptional() projects?: unknown[];
  @IsOptional() education?: unknown[];
  @IsOptional() certificates?: unknown[];
  @IsOptional() skills?: unknown[];
  @IsOptional() languages?: unknown[];
}
