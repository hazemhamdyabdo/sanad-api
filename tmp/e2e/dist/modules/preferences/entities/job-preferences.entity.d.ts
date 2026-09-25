import type { WorkType } from '../../../common/types/contract.js';
export declare class JobPreferences {
    deviceId: string;
    country: string;
    city: string | null;
    workTypes: WorkType[];
    willingToRelocate: boolean;
    createdAt: Date;
    updatedAt: Date;
}
