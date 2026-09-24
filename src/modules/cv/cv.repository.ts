import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
import type { SectionId } from '../../common/types/contract.js';
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

  findByDeviceId(deviceId: string): Promise<Cv | null> {
    return this.cvRepo.findOneBy({ deviceId });
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

  findSectionsByCvId(cvId: string): Promise<CvSection[]> {
    return this.cvSectionRepo.find({ where: { cvId } });
  }

  /**
   * Confirming a section from `POST .../confirm` always inserts a fresh row (a section is only ever
   * confirmed once through that flow), but `PATCH /cv` can rewrite an already-confirmed section from
   * the review screen — this updates the existing row in place instead of violating the
   * `(cvId, section)` unique index with a second insert.
   */
  async upsertSection(cvId: string, section: SectionId, content: unknown): Promise<void> {
    const existing = await this.cvSectionRepo.findOneBy({ cvId, section });
    if (existing) {
      existing.content = content;
      existing.confirmedAt = new Date();
      await this.cvSectionRepo.save(existing);
    } else {
      await this.cvSectionRepo.save({ id: generateId('sec'), cvId, section, content, confirmedAt: new Date() });
    }
  }

  /** Binds a repository to a shared transaction manager when one is given, otherwise uses the module's own connection. */
  private scoped<T extends object>(repo: Repository<T>, manager?: EntityManager): Repository<T> {
    return manager ? manager.withRepository(repo) : repo;
  }
}
