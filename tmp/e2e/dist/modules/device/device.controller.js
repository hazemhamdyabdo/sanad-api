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
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DeviceId } from '../../common/decorators/device-id.decorator.js';
import { SkipDeviceLookup } from '../../common/decorators/skip-device-lookup.decorator.js';
import { DeviceService } from './device.service.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
let DeviceController = class DeviceController {
    deviceService;
    constructor(deviceService) {
        this.deviceService = deviceService;
    }
    register(deviceId, dto) {
        return this.deviceService.register(deviceId, dto);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.OK),
    SkipDeviceLookup(),
    __param(0, DeviceId()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RegisterDeviceDto]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "register", null);
DeviceController = __decorate([
    Controller('devices'),
    __metadata("design:paramtypes", [DeviceService])
], DeviceController);
export { DeviceController };
//# sourceMappingURL=device.controller.js.map