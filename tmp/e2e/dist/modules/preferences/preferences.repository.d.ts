import { Repository } from 'typeorm';
import { JobPreferences } from './entities/job-preferences.entity.js';
export declare class PreferencesRepository {
    private readonly preferencesRepo;
    constructor(preferencesRepo: Repository<JobPreferences>);
    findByDeviceId(deviceId: string): Promise<JobPreferences | null>;
    upsert(preferences: Omit<JobPreferences, 'createdAt' | 'updatedAt'>): Promise<JobPreferences>;
}
