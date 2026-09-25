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
import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { CreateTranscriptionDto } from './dto/create-transcription.dto.js';
import { TranscriptionService } from './transcription.service.js';
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
let TranscriptionController = class TranscriptionController {
    transcriptionService;
    constructor(transcriptionService) {
        this.transcriptionService = transcriptionService;
    }
    create(device, audio, dto) {
        return this.transcriptionService.transcribe(device.id, audio, dto.sessionId);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.OK),
    UseInterceptors(FileInterceptor('audio', { limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } })),
    __param(0, CurrentDevice()),
    __param(1, UploadedFile()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object, CreateTranscriptionDto]),
    __metadata("design:returntype", Promise)
], TranscriptionController.prototype, "create", null);
TranscriptionController = __decorate([
    Controller('transcriptions'),
    __metadata("design:paramtypes", [TranscriptionService])
], TranscriptionController);
export { TranscriptionController };
//# sourceMappingURL=transcription.controller.js.map