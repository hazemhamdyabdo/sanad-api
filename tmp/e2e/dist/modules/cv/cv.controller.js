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
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Res } from '@nestjs/common';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { CvService } from './cv.service.js';
import { PatchCvDto } from './dto/patch-cv.dto.js';
let CvController = class CvController {
    cvService;
    constructor(cvService) {
        this.cvService = cvService;
    }
    getCv(device) {
        return this.cvService.getForDevice(device.id);
    }
    patchCv(device, dto) {
        return this.cvService.patch(device.id, dto);
    }
    async exportPdf(device, response) {
        const { file, filename } = await this.cvService.exportPdf(device.id);
        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': file.length.toString(),
        });
        response.end(file);
    }
};
__decorate([
    Get(),
    __param(0, CurrentDevice()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "getCv", null);
__decorate([
    Patch(),
    __param(0, CurrentDevice()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, PatchCvDto]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "patchCv", null);
__decorate([
    Post('pdf'),
    HttpCode(HttpStatus.OK),
    __param(0, CurrentDevice()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "exportPdf", null);
CvController = __decorate([
    Controller('cv'),
    __metadata("design:paramtypes", [CvService])
], CvController);
export { CvController };
//# sourceMappingURL=cv.controller.js.map