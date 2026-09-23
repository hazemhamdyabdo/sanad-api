import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cv } from './entities/cv.entity.js';

@Injectable()
export class CvRepository {
  constructor(@InjectRepository(Cv) private readonly repo: Repository<Cv>) {}

  async existsForDevice(deviceId: string): Promise<boolean> {
    const cv = await this.repo.findOneBy({ deviceId });
    return cv !== null;
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
