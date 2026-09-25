import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../../ai/index.js';
import { EmailModule } from '../../integrations/email/email.module.js';
import { CvModule } from '../cv/index.js';
import { JobsModule } from '../jobs/index.js';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsRepository } from './applications.repository.js';
import { ApplicationsService } from './applications.service.js';
import { Application } from './entities/application.entity.js';
import { ApplicationBatch } from './entities/application-batch.entity.js';

/** Real applying — tailor per job, then email it (`email` jobs) or prepare it for the user to finish (`external` jobs). */
@Module({
  imports: [TypeOrmModule.forFeature([Application, ApplicationBatch]), AiModule, EmailModule, CvModule, JobsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
