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
import { Controller, Get, HttpCode, HttpStatus, Param, Post, UploadedFile as UploadedFileDecorator, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { MAX_UPLOAD_BYTES, UploadService } from './upload.service.js';
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    create(device, file) {
        return this.uploadService.create(device.id, file);
    }
    getStatus(device, uploadId) {
        return this.uploadService.getStatus(uploadId, device.id);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.ACCEPTED),
    UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } })),
    __param(0, CurrentDevice()),
    __param(1, UploadedFileDecorator()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "create", null);
__decorate([
    Get(':uploadId'),
    __param(0, CurrentDevice()),
    __param(1, Param('uploadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getStatus", null);
UploadController = __decorate([
    Controller('cv/uploads'),
    __metadata("design:paramtypes", [UploadService])
], UploadController);
export { UploadController };
//# sourceMappingURL=upload.controller.js.map