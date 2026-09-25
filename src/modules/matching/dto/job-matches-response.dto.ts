import type { ApplicationStatus, ApplyMethod, EmploymentType, MatchesStatus, RoleMatch, WorkType } from '../../../common/types/contract.js';
import type { PreferencesResponseDto } from '../../preferences/index.js';

/** One entry of `GET /jobs/matches`'s `jobs` — see API-CONTRACT.md §6. */
export interface MatchedJobDto {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  /** Every place this job is posted — the same job listed for several cities is one entry. `location` first; [] when unknown. */
  locations: string[];
  country: string;
  city: string | null;
  employmentType: EmploymentType;
  workType: WorkType;
  postedAt: string;
  match: number;
  roleMatch: RoleMatch;
  whyMatch: string[];
  gaps: string[];
  apply: { method: ApplyMethod; url: string; email: string | null };
  /** This device's application for the job, if it has one — `null` means never applied. */
  application: { id: string; status: ApplicationStatus } | null;
}

export interface JobMatchesResponseDto {
  status: MatchesStatus;
  preferences: PreferencesResponseDto;
  jobs: MatchedJobDto[];
}
