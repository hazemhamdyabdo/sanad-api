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

@Module({
  imports: [TypeOrmModule.forFeature([Upload]), StorageModule, AiModule, CvModule],
  controllers: [UploadController],
  providers: [UploadService, UploadRepository, UploadCleanupService],
  exports: [UploadService],
})
export class UploadModule {}
