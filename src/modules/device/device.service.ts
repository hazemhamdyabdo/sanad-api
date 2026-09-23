import { Injectable } from '@nestjs/common';
import { DeviceRepository } from './device.repository.js';
import type { Device } from './entities/device.entity.js';
import type { RegisterDeviceDto } from './dto/register-device.dto.js';
import type { DeviceResponseDto } from './dto/device-response.dto.js';

@Injectable()
export class DeviceService {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  findById(id: string): Promise<Device | null> {
    return this.deviceRepository.findById(id);
  }

  async register(deviceId: string, dto: RegisterDeviceDto): Promise<DeviceResponseDto> {
    await this.deviceRepository.upsert({
      id: deviceId,
      platform: dto.platform,
      appVersion: dto.appVersion,
      locale: dto.locale,
      region: dto.region,
    });
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new Error('Device upsert did not persist the row');
    }
    return this.toResponseDto(device);
  }

  private toResponseDto(device: Device): DeviceResponseDto {
    return {
      deviceId: device.id,
      createdAt: device.createdAt.toISOString(),
      // The conversation and cv modules don't exist yet — nothing can have
      // an active session or a CV until they do (see TODO.md).
      state: {
        hasCv: false,
        activeSessionId: null,
        completedSections: [],
        nextSection: null,
      },
    };
  }
}
