import { IsOptional, IsString, MinLength } from 'class-validator';

/** The non-file multipart fields of POST /transcriptions; `audio` itself arrives through FileInterceptor. */
export class CreateTranscriptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  sessionId?: string;
}
