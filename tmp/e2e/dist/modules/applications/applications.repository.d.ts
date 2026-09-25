import { Repository, type EntityManager } from 'typeorm';
import { Application } from './entities/application.entity.js';
import { ApplicationBatch } from './entities/application-batch.entity.js';
export declare class ApplicationsRepository {
    private readonly applicationRepo;
    private readonly batchRepo;
    constructor(applicationRepo: Repository<Application>, batchRepo: Repository<ApplicationBatch>);
    inDeviceLock<T>(deviceId: string, work: (manager: EntityManager) => Promise<T>): Promise<T>;
    findForJobs(deviceId: string, jobIds: string[], manager?: EntityManager): Promise<Application[]>;
    save(application: Application, manager?: EntityManager): Promise<Application>;
    createBatch(batch: Omit<ApplicationBatch, 'createdAt'>, manager?: EntityManager): Promise<ApplicationBatch>;
    saveBatch(batch: ApplicationBatch): Promise<ApplicationBatch>;
    findBatch(batchId: string, deviceId?: string): Promise<ApplicationBatch | null>;
    findById(id: string, deviceId?: string): Promise<Application | null>;
    findByIds(ids: string[]): Promise<Application[]>;
    findAllForDevice(deviceId: string): Promise<Application[]>;
    findStaleProcessing(before: Date): Promise<Application[]>;
    countProcessingInBatch(batchId: string): Promise<number>;
    private apps;
}
