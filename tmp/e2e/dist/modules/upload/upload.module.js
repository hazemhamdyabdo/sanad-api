var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../../ai/index.js';
import { StorageModule } from '../../integrations/storage/storage.module.js';
import { CvModule } from '../cv/index.js';
import { Upload } from './entities/upload.entity.js';
import { UploadCleanupService } from './upload-cleanup.service.js';
import { UploadController } from './upload.controller.js';
import { UploadRepository } from './upload.repository.js';
import { UploadService } from './upload.service.js';
let UploadModule = class UploadModule {
};
UploadModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Upload]), StorageModule, AiModule, CvModule],
        controllers: [UploadController],
        providers: [UploadService, UploadRepository, UploadCleanupService],
        exports: [UploadService],
    })
], UploadModule);
export { UploadModule };
//# sourceMappingURL=upload.module.js.map