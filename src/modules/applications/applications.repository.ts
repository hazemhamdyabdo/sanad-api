import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository, type EntityManager } from 'typeorm';
import { Application } from './entities/application.entity.js';
import { ApplicationBatch } from './entities/application-batch.entity.js';

@Injectable()
export class ApplicationsRepository {
  constructor(
    @InjectRepository(Application) private readonly applicationRepo: Repository<Application>,
    @InjectRepository(ApplicationBatch) private readonly batchRepo: Repository<ApplicationBatch>,
  ) {}

  /**
   * Runs `work` in a transaction holding a per-device lock — two apply requests from the same device
   * (a double tap) are serialized, so the "already applied?" check and the insert can't interleave.
   */
  inDeviceLock<T>(deviceId: string, work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.applicationRepo.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`applications:${deviceId}`]);
      return work(manager);
    });
  }

  findForJobs(deviceId: string, jobIds: string[], manager?: EntityManager): Promise<Application[]> {
    return jobIds.length ? this.apps(manager).findBy({ deviceId, jobId: In(jobIds) }) : Promise.resolve([]);
  }

  save(application: Application, manager?: EntityManager): Promise<Application> {
    return this.apps(manager).save(application);
  }

  createBatch(batch: Omit<ApplicationBatch, 'createdAt'>, manager?: EntityManager): Promise<ApplicationBatch> {
    return (manager ? manager.withRepository(this.batchRepo) : this.batchRepo).save(batch);
  }

  saveBatch(batch: ApplicationBatch): Promise<ApplicationBatch> {
    return this.batchRepo.save(batch);
  }

  findBatch(batchId: string, deviceId?: string): Promise<ApplicationBatch | null> {
    return this.batchRepo.findOneBy(deviceId ? { id: batchId, deviceId } : { id: batchId });
  }

  findById(id: string, deviceId?: string): Promise<Application | null> {
    return this.applicationRepo.findOneBy(deviceId ? { id, deviceId } : { id });
  }

  findByIds(ids: string[]): Promise<Application[]> {
    return ids.length ? this.applicationRepo.findBy({ id: In(ids) }) : Promise.resolve([]);
  }

  findAllForDevice(deviceId: string): Promise<Application[]> {
    return this.applicationRepo.find({ where: { deviceId }, order: { createdAt: 'DESC' } });
  }

  /** `processing` applications not touched since `before` — interrupted by a restart or a crash. */
  findStaleProcessing(before: Date): Promise<Application[]> {
    return this.applicationRepo.find({ where: { status: 'processing', updatedAt: LessThan(before) }, order: { createdAt: 'ASC' }, take: 20 });
  }

  countProcessingInBatch(batchId: string): Promise<number> {
    return this.applicationRepo.countBy({ batchId, status: 'processing' });
  }

  private apps(manager?: EntityManager): Repository<Application> {
    return manager ? manager.withRepository(this.applicationRepo) : this.applicationRepo;
  }
}
