import { Injectable } from '@nestjs/common';
import { CvRepository } from './cv.repository.js';

@Injectable()
export class CvService {
  constructor(private readonly cvRepository: CvRepository) {}

  existsForDevice(deviceId: string): Promise<boolean> {
    return this.cvRepository.existsForDevice(deviceId);
  }

  deleteById(id: string): Promise<void> {
    return this.cvRepository.deleteById(id);
  }
}
