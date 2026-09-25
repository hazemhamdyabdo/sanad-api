import type { ApplicationStatus, ApplyMethod, EmploymentType, MatchesStatus, RoleMatch, WorkType } from '../../../common/types/contract.js';
import type { PreferencesResponseDto } from '../../preferences/index.js';
export interface MatchedJobDto {
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    country: string;
    city: string | null;
    employmentType: EmploymentType;
    workType: WorkType;
    postedAt: string;
    match: number;
    roleMatch: RoleMatch;
    whyMatch: string[];
    gaps: string[];
    apply: {
        method: ApplyMethod;
        url: string;
        email: string | null;
    };
    application: {
        id: string;
        status: ApplicationStatus;
    } | null;
}
export interface JobMatchesResponseDto {
    status: MatchesStatus;
    preferences: PreferencesResponseDto;
    jobs: MatchedJobDto[];
}
