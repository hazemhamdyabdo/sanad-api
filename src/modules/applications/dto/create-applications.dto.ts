import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString } from 'class-validator';

/** Bounded so one tap can't start an unbounded amount of tailoring/sending work. */
export const MAX_JOBS_PER_REQUEST = 20;

export class CreateApplicationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_JOBS_PER_REQUEST)
  @ArrayUnique()
  @IsString({ each: true })
  jobIds!: string[];
}
