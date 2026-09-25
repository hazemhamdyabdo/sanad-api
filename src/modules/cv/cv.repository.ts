import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
import type { SectionId } from '../../common/types/contract.js';
import { Cv } from './entities/cv.entity.js';
import { CvAnalysis } from './entities/cv-analysis.entity.js';
import { CvSection } from './entities/cv-section.entity.js';

@Injectable()
export class CvRepository {
  constructor(
    @InjectRepository(Cv) private readonly cvRepo: Repository<Cv>,
    @InjectRepository(CvSection) private readonly cvSectionRepo: Repository<CvSection>,
    @InjectRepository(CvAnalysis) private readonly cvAnalysisRepo: Repository<CvAnalysis>,
  ) {}

  async existsForDevice(deviceId: string): Promise<boolean> {
    const cv = await this.cvRepo.findOneBy({ deviceId });
    return cv !== null;
  }

  findByDeviceId(deviceId: string, manager?: EntityManager): Promise<Cv | null> {
    return this.scoped(this.cvRepo, manager).findOneBy({ deviceId });
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

  async deleteSectionsByCvId(cvId: string, manager?: EntityManager): Promise<void> {
    await this.scoped(this.cvSectionRepo, manager).delete({ cvId });
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
  async upsertSection(cvId: string, section: SectionId, content: unknown, manager?: EntityManager): Promise<void> {
    const repository = this.scoped(this.cvSectionRepo, manager);
    const existing = await repository.findOneBy({ cvId, section });
    if (existing) {
      existing.content = content;
      existing.confirmedAt = new Date();
      await repository.save(existing);
    } else {
      await repository.save({ id: generateId('sec'), cvId, section, content, confirmedAt: new Date() });
    }
  }

  findAnalysisByDeviceId(deviceId: string): Promise<CvAnalysis | null> {
    return this.cvAnalysisRepo.findOneBy({ deviceId });
  }

  findAnalysisByUploadId(uploadId: string, deviceId: string): Promise<CvAnalysis | null> {
    return this.cvAnalysisRepo.findOneBy({ uploadId, deviceId });
  }

  /** One row per device — replaces whatever analysis was there before, same "a new upload starts fresh" semantics as `Cv` itself. */
  async upsertAnalysis(analysis: Omit<CvAnalysis, 'createdAt' | 'updatedAt'>, manager?: EntityManager): Promise<CvAnalysis> {
    const repository = this.scoped(this.cvAnalysisRepo, manager);
    // Two uploads for one device can finish together. Resolve that unique-key race inside
    // Postgres instead of doing a separate read followed by an insert.
    await repository.upsert(analysis, { conflictPaths: ['deviceId'] });
    return repository.findOneByOrFail({ deviceId: analysis.deviceId });
  }

  /** Binds a repository to a shared transaction manager when one is given, otherwise uses the module's own connection. */
  private scoped<T extends object>(repo: Repository<T>, manager?: EntityManager): Repository<T> {
    return manager ? manager.withRepository(repo) : repo;
  }
}
