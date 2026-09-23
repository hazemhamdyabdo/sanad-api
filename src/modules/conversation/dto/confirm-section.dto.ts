import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmSectionDto {
  @IsString()
  @MinLength(1)
  messageId!: string;

  @IsBoolean()
  isLast!: boolean;

  /** Shape depends on the section being confirmed — validated against CARD_SCHEMA_BY_SECTION in the service, not here. */
  @IsOptional()
  edits?: Record<string, unknown> | unknown[] | null;
}
