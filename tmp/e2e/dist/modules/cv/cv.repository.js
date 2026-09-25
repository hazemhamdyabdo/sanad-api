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
import { Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
import { Cv } from './entities/cv.entity.js';
import { CvAnalysis } from './entities/cv-analysis.entity.js';
import { CvSection } from './entities/cv-section.entity.js';
let CvRepository = class CvRepository {
    cvRepo;
    cvSectionRepo;
    cvAnalysisRepo;
    constructor(cvRepo, cvSectionRepo, cvAnalysisRepo) {
        this.cvRepo = cvRepo;
        this.cvSectionRepo = cvSectionRepo;
        this.cvAnalysisRepo = cvAnalysisRepo;
    }
    async existsForDevice(deviceId) {
        const cv = await this.cvRepo.findOneBy({ deviceId });
        return cv !== null;
    }
    findByDeviceId(deviceId, manager) {
        return this.scoped(this.cvRepo, manager).findOneBy({ deviceId });
    }
    async deleteById(id, manager) {
        await this.scoped(this.cvRepo, manager).delete(id);
    }
    findById(id, manager) {
        return this.scoped(this.cvRepo, manager).findOneBy({ id });
    }
    createCv(cv, manager) {
        return this.scoped(this.cvRepo, manager).save(cv);
    }
    saveCv(cv, manager) {
        return this.scoped(this.cvRepo, manager).save(cv);
    }
    createSection(section, manager) {
        return this.scoped(this.cvSectionRepo, manager).save(section);
    }
    async deleteSectionsByCvId(cvId, manager) {
        await this.scoped(this.cvSectionRepo, manager).delete({ cvId });
    }
    findSectionsByCvId(cvId) {
        return this.cvSectionRepo.find({ where: { cvId } });
    }
    async upsertSection(cvId, section, content, manager) {
        const repository = this.scoped(this.cvSectionRepo, manager);
        const existing = await repository.findOneBy({ cvId, section });
        if (existing) {
            existing.content = content;
            existing.confirmedAt = new Date();
            await repository.save(existing);
        }
        else {
            await repository.save({ id: generateId('sec'), cvId, section, content, confirmedAt: new Date() });
        }
    }
    findAnalysisByDeviceId(deviceId) {
        return this.cvAnalysisRepo.findOneBy({ deviceId });
    }
    findAnalysisByUploadId(uploadId, deviceId) {
        return this.cvAnalysisRepo.findOneBy({ uploadId, deviceId });
    }
    async upsertAnalysis(analysis, manager) {
        const repository = this.scoped(this.cvAnalysisRepo, manager);
        await repository.upsert(analysis, { conflictPaths: ['deviceId'] });
        return repository.findOneByOrFail({ deviceId: analysis.deviceId });
    }
    scoped(repo, manager) {
        return manager ? manager.withRepository(repo) : repo;
    }
};
CvRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Cv)),
    __param(1, InjectRepository(CvSection)),
    __param(2, InjectRepository(CvAnalysis)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository])
], CvRepository);
export { CvRepository };
//# sourceMappingURL=cv.repository.js.map