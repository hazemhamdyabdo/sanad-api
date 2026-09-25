import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvController } from './cv.controller.js';
import { CvRepository } from './cv.repository.js';
import { CvService } from './cv.service.js';
import { Cv } from './entities/cv.entity.js';
import { CvAnalysis } from './entities/cv-analysis.entity.js';
import { CvSection } from './entities/cv-section.entity.js';
import { CvPdfRenderer } from '../../integrations/pdf/cv-pdf.renderer.js';

/** Everything CV-shaped for a device lives here: GET/PATCH /cv, cascading cv deletes, confirming a section into the cv, and the CV-upload analysis (`CvAnalysis`) `modules/upload` writes to and reads from through `CvService`. */
@Module({
  imports: [TypeOrmModule.forFeature([Cv, CvSection, CvAnalysis])],
  controllers: [CvController],
  providers: [CvService, CvRepository, CvPdfRenderer],
  exports: [CvService],
})
export class CvModule {}
