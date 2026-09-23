import { IsIn, IsInt, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { MESSAGE_SOURCES, type MessageSource } from '../../../common/types/contract.js';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsIn(MESSAGE_SOURCES)
  source!: MessageSource;

  @IsOptional()
  @IsInt()
  @IsPositive()
  audioDurationSec?: number;
}
