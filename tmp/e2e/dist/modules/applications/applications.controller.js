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
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationsDto } from './dto/create-applications.dto.js';
let ApplicationsController = class ApplicationsController {
    applicationsService;
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    create(device, dto) {
        return this.applicationsService.create(device.id, dto.jobIds);
    }
    list(device) {
        return this.applicationsService.list(device.id);
    }
    getBatch(device, batchId) {
        return this.applicationsService.getBatch(device.id, batchId);
    }
    markOpened(device, id) {
        return this.applicationsService.markOpened(device.id, id);
    }
    async getCv(device, id, response) {
        const { file, filename } = await this.applicationsService.getCvPdf(device.id, id);
        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': file.length.toString(),
        });
        response.end(file);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.ACCEPTED),
    __param(0, CurrentDevice()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, CreateApplicationsDto]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentDevice()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "list", null);
__decorate([
    Get('batches/:batchId'),
    __param(0, CurrentDevice()),
    __param(1, Param('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "getBatch", null);
__decorate([
    Post(':id/opened'),
    HttpCode(HttpStatus.OK),
    __param(0, CurrentDevice()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "markOpened", null);
__decorate([
    Get(':id/cv'),
    __param(0, CurrentDevice()),
    __param(1, Param('id')),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "getCv", null);
ApplicationsController = __decorate([
    Controller('applications'),
    __metadata("design:paramtypes", [ApplicationsService])
], ApplicationsController);
export { ApplicationsController };
//# sourceMappingURL=applications.controller.js.map