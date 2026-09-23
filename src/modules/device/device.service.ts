import { Injectable } from '@nestjs/common';
import { ConversationService } from '../conversation/index.js';
import { CvService } from '../cv/index.js';
import { DeviceRepository } from './device.repository.js';
import type { Device } from './entities/device.entity.js';
import type { RegisterDeviceDto } from './dto/register-device.dto.js';
import type { DeviceResponseDto } from './dto/device-response.dto.js';

@Injectable()
export class DeviceService {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly conversationService: ConversationService,
    private readonly cvService: CvService,
  ) {}

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

  private async toResponseDto(device: Device): Promise<DeviceResponseDto> {
    const [hasCv, sessionSummary] = await Promise.all([
      this.cvService.existsForDevice(device.id),
      this.conversationService.getActiveSessionSummary(device.id),
    ]);

    return {
      deviceId: device.id,
      createdAt: device.createdAt.toISOString(),
      state: {
        hasCv,
        activeSessionId: sessionSummary.activeSessionId,
        completedSections: sessionSummary.completedSections,
        nextSection: sessionSummary.nextSection,
      },
    };
  }
}
