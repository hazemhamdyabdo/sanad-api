import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Upload } from './entities/upload.entity.js';

@Injectable()
export class UploadRepository {
  constructor(@InjectRepository(Upload) private readonly uploadRepo: Repository<Upload>) {}

  create(upload: Omit<Upload, 'createdAt'>): Promise<Upload> {
    return this.uploadRepo.save(upload);
  }

  findById(id: string): Promise<Upload | null> {
    return this.uploadRepo.findOneBy({ id });
  }

  save(upload: Upload): Promise<Upload> {
    return this.uploadRepo.save(upload);
  }

  /** Every row past `expiresAt` regardless of status — a stuck `parsing` row as much as an old finished one. See `Upload`'s own doc comment for why this is safe. */
  findExpired(): Promise<Upload[]> {
    return this.uploadRepo.findBy({ expiresAt: LessThan(new Date()) });
  }

  async deleteById(id: string): Promise<void> {
    await this.uploadRepo.delete(id);
  }
}
