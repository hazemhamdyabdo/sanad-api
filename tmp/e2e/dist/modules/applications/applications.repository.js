var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Application } from './entities/application.entity.js';
import { ApplicationBatch } from './entities/application-batch.entity.js';
let ApplicationsRepository = class ApplicationsRepository {
    applicationRepo;
    batchRepo;
    constructor(applicationRepo, batchRepo) {
        this.applicationRepo = applicationRepo;
        this.batchRepo = batchRepo;
    }
    inDeviceLock(deviceId, work) {
        return this.applicationRepo.manager.transaction(async (manager) => {
            await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`applications:${deviceId}`]);
            return work(manager);
        });
    }
    findForJobs(deviceId, jobIds, manager) {
        return jobIds.length ? this.apps(manager).findBy({ deviceId, jobId: In(jobIds) }) : Promise.resolve([]);
    }
    save(application, manager) {
        return this.apps(manager).save(application);
    }
    createBatch(batch, manager) {
        return (manager ? manager.withRepository(this.batchRepo) : this.batchRepo).save(batch);
    }
    saveBatch(batch) {
        return this.batchRepo.save(batch);
    }
    findBatch(batchId, deviceId) {
        return this.batchRepo.findOneBy(deviceId ? { id: batchId, deviceId } : { id: batchId });
    }
    findById(id, deviceId) {
        return this.applicationRepo.findOneBy(deviceId ? { id, deviceId } : { id });
    }
    findByIds(ids) {
        return ids.length ? this.applicationRepo.findBy({ id: In(ids) }) : Promise.resolve([]);
    }
    findAllForDevice(deviceId) {
        return this.applicationRepo.find({ where: { deviceId }, order: { createdAt: 'DESC' } });
    }
    findStaleProcessing(before) {
        return this.applicationRepo.find({ where: { status: 'processing', updatedAt: LessThan(before) }, order: { createdAt: 'ASC' }, take: 20 });
    }
    countProcessingInBatch(batchId) {
        return this.applicationRepo.countBy({ batchId, status: 'processing' });
    }
    apps(manager) {
        return manager ? manager.withRepository(this.applicationRepo) : this.applicationRepo;
    }
};
ApplicationsRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Application)),
    __param(1, InjectRepository(ApplicationBatch)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], ApplicationsRepository);
export { ApplicationsRepository };
//# sourceMappingURL=applications.repository.js.map