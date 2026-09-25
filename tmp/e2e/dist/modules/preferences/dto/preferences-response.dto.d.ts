import type { WorkType } from '../../../common/types/contract.js';
export interface PreferencesResponseDto {
    country: string;
    city: string | null;
    workTypes: WorkType[];
    willingToRelocate: boolean;
}
