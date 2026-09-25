var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConversationService } from '../conversation/index.js';
import { CvService } from '../cv/index.js';
import { DeviceRepository } from './device.repository.js';
let DeviceService = class DeviceService {
    deviceRepository;
    conversationService;
    cvService;
    constructor(deviceRepository, conversationService, cvService) {
        this.deviceRepository = deviceRepository;
        this.conversationService = conversationService;
        this.cvService = cvService;
    }
    findById(id) {
        return this.deviceRepository.findById(id);
    }
    async register(deviceId, dto) {
        await this.deviceRepository.upsert({
            id: deviceId,
            platform: dto.platform,
            appVersion: dto.appVersion,
            locale: dto.locale,
            region: dto.region,
        });
        const device = await this.deviceRepository.findById(deviceId);
        if (!device) {
            throw new Error('Device upsert did not persist the row');
        }
        return this.toResponseDto(device);
    }
    async toResponseDto(device) {
        const [hasCv, sessionSummary] = await Promise.all([
            this.cvService.existsForDevice(device.id),
            this.conversationService.getActiveSessionSummary(device.id),
        ]);
        return {
            deviceId: device.id,
            createdAt: device.createdAt.toISOString(),
            state: {
                hasCv,
                activeSessionId: sessionSummary.activeSessionId,
                completedSections: sessionSummary.completedSections,
                nextSection: sessionSummary.nextSection,
            },
        };
    }
};
DeviceService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DeviceRepository,
        ConversationService,
        CvService])
], DeviceService);
export { DeviceService };
//# sourceMappingURL=device.service.js.map