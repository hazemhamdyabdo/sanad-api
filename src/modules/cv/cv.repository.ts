import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Cv } from './entities/cv.entity.js';
import { CvSection } from './entities/cv-section.entity.js';

@Injectable()
export class CvRepository {
  constructor(
    @InjectRepository(Cv) private readonly cvRepo: Repository<Cv>,
    @InjectRepository(CvSection) private readonly cvSectionRepo: Repository<CvSection>,
  ) {}

  async existsForDevice(deviceId: string): Promise<boolean> {
    const cv = await this.cvRepo.findOneBy({ deviceId });
    return cv !== null;
  }

  async deleteById(id: string, manager?: EntityManager): Promise<void> {
    await this.scoped(this.cvRepo, manager).delete(id);
  }

  findById(id: string, manager?: EntityManager): Promise<Cv | null> {
    return this.scoped(this.cvRepo, manager).findOneBy({ id });
  }

  createCv(cv: Omit<Cv, 'createdAt' | 'updatedAt'>, manager?: EntityManager): Promise<Cv> {
    return this.scoped(this.cvRepo, manager).save(cv);
  }

  saveCv(cv: Cv, manager?: EntityManager): Promise<Cv> {
    return this.scoped(this.cvRepo, manager).save(cv);
  }

  createSection(section: CvSection, manager?: EntityManager): Promise<CvSection> {
    return this.scoped(this.cvSectionRepo, manager).save(section);
  }

  /** Binds a repository to a shared transaction manager when one is given, otherwise uses the module's own connection. */
  private scoped<T extends object>(repo: Repository<T>, manager?: EntityManager): Repository<T> {
    return manager ? manager.withRepository(repo) : repo;
  }
}
