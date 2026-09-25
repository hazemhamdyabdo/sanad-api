import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString } from 'class-validator';

/** Bounded so one tap can't start an unbounded amount of tailoring/sending work. */
export const MAX_JOBS_PER_REQUEST = 20;

export class CreateApplicationsDto {
  @IsArray({ message: 'اختار الوظايف اللي عايز تقدّم عليها الأول' })
  @ArrayMinSize(1, { message: 'اختار وظيفة واحدة على الأقل' })
  @ArrayMaxSize(MAX_JOBS_PER_REQUEST, { message: `تقدر تقدّم على ${MAX_JOBS_PER_REQUEST} وظيفة بالكتير في المرة الواحدة — شيل شوية وجرّب تاني` })
  @ArrayUnique({ message: 'في وظيفة متكررة في اختياراتك' })
  @IsString({ each: true })
  jobIds!: string[];
}
