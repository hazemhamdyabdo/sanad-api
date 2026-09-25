import { Injectable } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error.js';
import { WORK_TYPES, WORLDWIDE } from '../../common/types/contract.js';
import type { Device } from '../device/index.js';
import type { PreferencesResponseDto } from './dto/preferences-response.dto.js';
import type { PutPreferencesDto } from './dto/put-preferences.dto.js';
import type { JobPreferences } from './entities/job-preferences.entity.js';
import { PreferencesRepository } from './preferences.repository.js';

@Injectable()
export class PreferencesService {
  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  async put(deviceId: string, dto: PutPreferencesDto): Promise<PreferencesResponseDto> {
    if (dto.country === WORLDWIDE && dto.city) {
      throw new AppError('INVALID_REQUEST', 'مينفعش تختار مدينة مع "أي مكان في العالم"', { retryable: false });
    }
    const saved = await this.preferencesRepository.upsert({
      deviceId,
      country: dto.country,
      city: dto.city ?? null,
      workTypes: dto.workTypes,
      willingToRelocate: dto.willingToRelocate ?? false,
    });
    return toDto(saved);
  }

  /**
   * The device's saved preferences, or — before it has ever saved any — the same defaults the app
   * starts from: the device's registered region, any city, every work type.
   */
  async getForDevice(device: Device): Promise<PreferencesResponseDto> {
    const saved = await this.preferencesRepository.findByDeviceId(device.id);
    if (saved) {
      return toDto(saved);
    }
    const region = device.region?.toUpperCase();
    return {
      country: /^[A-Z]{2}$/.test(region) ? region : 'EG',
      city: null,
      workTypes: [...WORK_TYPES],
      willingToRelocate: false,
    };
  }
}

function toDto(preferences: JobPreferences): PreferencesResponseDto {
  return {
    country: preferences.country,
    city: preferences.city,
    workTypes: preferences.workTypes,
    willingToRelocate: preferences.willingToRelocate,
  };
}
