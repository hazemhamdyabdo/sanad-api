import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPreferences } from './entities/job-preferences.entity.js';

@Injectable()
export class PreferencesRepository {
  constructor(@InjectRepository(JobPreferences) private readonly preferencesRepo: Repository<JobPreferences>) {}

  findByDeviceId(deviceId: string): Promise<JobPreferences | null> {
    return this.preferencesRepo.findOneBy({ deviceId });
  }

  async upsert(preferences: Omit<JobPreferences, 'createdAt' | 'updatedAt'>): Promise<JobPreferences> {
    await this.preferencesRepo.upsert(preferences, { conflictPaths: ['deviceId'] });
    return this.preferencesRepo.findOneByOrFail({ deviceId: preferences.deviceId });
  }
}
