import type { RoleGroupId } from '../roles.js';
import type { TargetCountry } from '../countries.js';
import type { ApplyMethod, EmploymentType, WorkType } from '../../../common/types/contract.js';
export type { ApplyMethod };
export declare class Job {
    id: string;
    provider: string;
    externalId: string;
    role: string;
    group: RoleGroupId;
    country: TargetCountry;
    title: string;
    company: string | null;
    location: string | null;
    snippet: string | null;
    salary: string | null;
    jobType: string | null;
    link: string;
    applyMethod: ApplyMethod;
    applyEmail: string | null;
    sourceUpdatedAt: Date | null;
    workType: WorkType | null;
    employmentType: EmploymentType | null;
    city: string | null;
    raw: Record<string, unknown>;
    firstSeenAt: Date;
    lastSeenAt: Date;
}
