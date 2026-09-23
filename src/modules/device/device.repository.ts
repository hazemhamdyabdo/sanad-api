import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity.js';

export interface UpsertDeviceInput {
  id: string;
  platform: string;
  appVersion: string;
  locale: string;
  region: string;
}

@Injectable()
export class DeviceRepository {
  constructor(@InjectRepository(Device) private readonly repo: Repository<Device>) {}

  findById(id: string): Promise<Device | null> {
    return this.repo.findOneBy({ id });
  }

  /** Insert or update by id — createdAt is intentionally omitted so a re-register never resets it. */
  async upsert(input: UpsertDeviceInput): Promise<void> {
    await this.repo.upsert(input, { conflictPaths: ['id'] });
  }
}
