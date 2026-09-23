import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { SESSION_MODES, type SessionMode } from '../../../common/types/contract.js';

export class CreateConversationDto {
  @IsIn(SESSION_MODES)
  mode!: SessionMode;

  @IsOptional()
  @IsString()
  uploadId?: string | null;

  @IsOptional()
  @IsBoolean()
  restart?: boolean;
}
