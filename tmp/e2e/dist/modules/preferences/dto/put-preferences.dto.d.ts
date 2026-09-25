import { type WorkType } from '../../../common/types/contract.js';
export declare class PutPreferencesDto {
    country: string;
    city: string | null;
    workTypes: WorkType[];
    willingToRelocate?: boolean;
}
