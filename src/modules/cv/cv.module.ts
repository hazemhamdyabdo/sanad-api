import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvRepository } from './cv.repository.js';
import { CvService } from './cv.service.js';
import { Cv } from './entities/cv.entity.js';

/** No controller yet — GET/PATCH /cv and POST /cv/pdf land with the cv-building endpoints. For now this only exposes what device and conversation need: hasCv and cascading cv deletes. */
@Module({
  imports: [TypeOrmModule.forFeature([Cv])],
  providers: [CvService, CvRepository],
  exports: [CvService],
})
export class CvModule {}
