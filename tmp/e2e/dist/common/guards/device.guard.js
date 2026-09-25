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
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { DeviceService } from '../../modules/device/index.js';
import { AppError } from '../errors/app-error.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SKIP_DEVICE_LOOKUP_KEY } from '../decorators/skip-device-lookup.decorator.js';
export const DEVICE_ID_HEADER = 'x-device-id';
let DeviceGuard = class DeviceGuard {
    reflector;
    deviceService;
    constructor(reflector, deviceService) {
        this.reflector = reflector;
        this.deviceService = deviceService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const deviceId = request.header(DEVICE_ID_HEADER);
        if (!deviceId) {
            throw new AppError('DEVICE_REQUIRED', 'محتاجين نتعرف على جهازك الأول', { retryable: false });
        }
        if (!isUUID(deviceId, 4)) {
            throw new AppError('INVALID_REQUEST', 'معرّف الجهاز مش بالشكل الصحيح', { retryable: false });
        }
        request.deviceId = deviceId;
        const skipLookup = this.reflector.getAllAndOverride(SKIP_DEVICE_LOOKUP_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skipLookup) {
            return true;
        }
        const device = await this.deviceService.findById(deviceId);
        if (!device) {
            throw new AppError('NOT_FOUND', 'الجهاز ده مش متسجل، سجله الأول', { retryable: false });
        }
        request.device = device;
        return true;
    }
};
DeviceGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector,
        DeviceService])
], DeviceGuard);
export { DeviceGuard };
//# sourceMappingURL=device.guard.js.map