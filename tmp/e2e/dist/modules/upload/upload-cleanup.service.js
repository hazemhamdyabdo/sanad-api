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
var UploadCleanupService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../../integrations/storage/storage.interface.js';
import { UploadRepository } from './upload.repository.js';
const SWEEP_INTERVAL_MS = 30 * 60 * 1000;
let UploadCleanupService = UploadCleanupService_1 = class UploadCleanupService {
    uploadRepository;
    storage;
    logger = new Logger(UploadCleanupService_1.name);
    timer = null;
    constructor(uploadRepository, storage) {
        this.uploadRepository = uploadRepository;
        this.storage = storage;
    }
    onModuleInit() {
        this.timer = setInterval(() => {
            this.sweep().catch((error) => this.logger.error('Upload cleanup sweep failed', error instanceof Error ? error.stack : error));
        }, SWEEP_INTERVAL_MS);
        this.timer.unref?.();
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    async sweep() {
        const expired = await this.uploadRepository.findExpired();
        for (const upload of expired) {
            await this.storage.delete(upload.filePath);
            await this.uploadRepository.deleteById(upload.id);
        }
        if (expired.length > 0) {
            this.logger.log(`Cleaned up ${expired.length} expired upload(s).`);
        }
    }
};
UploadCleanupService = UploadCleanupService_1 = __decorate([
    Injectable(),
    __param(1, Inject(STORAGE_PROVIDER)),
    __metadata("design:paramtypes", [UploadRepository, Object])
], UploadCleanupService);
export { UploadCleanupService };
//# sourceMappingURL=upload-cleanup.service.js.map