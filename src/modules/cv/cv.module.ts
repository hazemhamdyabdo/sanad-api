import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvController } from './cv.controller.js';
import { CvRepository } from './cv.repository.js';
import { CvService } from './cv.service.js';
import { Cv } from './entities/cv.entity.js';
import { CvSection } from './entities/cv-section.entity.js';
import { CvPdfRenderer } from '../../integrations/pdf/cv-pdf.renderer.js';

/** POST /cv/pdf isn't built yet — everything else (GET/PATCH /cv, hasCv, cascading cv deletes, confirming a section into the cv) lives here. */
@Module({
  imports: [TypeOrmModule.forFeature([Cv, CvSection])],
  controllers: [CvController],
  providers: [CvService, CvRepository, CvPdfRenderer],
  exports: [CvService],
})
export class CvModule {}
