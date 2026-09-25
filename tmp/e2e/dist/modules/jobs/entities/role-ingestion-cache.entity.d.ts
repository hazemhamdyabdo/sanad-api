import type { RoleGroupId } from '../roles.js';
import type { TargetCountry } from '../countries.js';
export type RoleIngestionStatus = 'pending' | 'fresh' | 'failed';
export declare class RoleIngestionCache {
    id: string;
    group: RoleGroupId;
    country: TargetCountry;
    status: RoleIngestionStatus;
    lastFetchedAt: Date | null;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
}
