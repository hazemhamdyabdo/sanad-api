import type { EmploymentType, Seniority, WorkType } from '../../common/types/contract.js';
export declare function deriveWorkType(...texts: Array<string | null>): WorkType;
export declare function deriveEmploymentType(roleCode: string, jobType: string | null, ...texts: Array<string | null>): EmploymentType;
export declare function inferSeniorityFromTitle(title: string): Seniority | null;
export declare function toPlainText(html: string | null): string;
