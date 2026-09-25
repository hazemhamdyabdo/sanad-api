var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvController } from './cv.controller.js';
import { CvRepository } from './cv.repository.js';
import { CvService } from './cv.service.js';
import { Cv } from './entities/cv.entity.js';
import { CvAnalysis } from './entities/cv-analysis.entity.js';
import { CvSection } from './entities/cv-section.entity.js';
import { CvPdfRenderer } from '../../integrations/pdf/cv-pdf.renderer.js';
let CvModule = class CvModule {
};
CvModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Cv, CvSection, CvAnalysis])],
        controllers: [CvController],
        providers: [CvService, CvRepository, CvPdfRenderer],
        exports: [CvService],
    })
], CvModule);
export { CvModule };
//# sourceMappingURL=cv.module.js.map