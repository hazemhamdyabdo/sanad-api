import { ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { WORK_TYPES, WORLDWIDE, type WorkType } from '../../../common/types/contract.js';

export class PutPreferencesDto {
  @IsString()
  @Matches(new RegExp(`^([A-Z]{2}|${WORLDWIDE})$`))
  country!: string;

  @ValidateIf((dto: PutPreferencesDto) => dto.city !== null && dto.city !== undefined)
  @IsString()
  @Matches(/^[a-z_]+$/)
  city!: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(WORK_TYPES, { each: true })
  workTypes!: WorkType[];

  @IsOptional()
  @IsBoolean()
  willingToRelocate?: boolean;
}
