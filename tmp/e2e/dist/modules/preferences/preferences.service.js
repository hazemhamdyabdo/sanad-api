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
import { AppError } from '../../common/errors/app-error.js';
import { WORK_TYPES, WORLDWIDE } from '../../common/types/contract.js';
import { PreferencesRepository } from './preferences.repository.js';
let PreferencesService = class PreferencesService {
    preferencesRepository;
    constructor(preferencesRepository) {
        this.preferencesRepository = preferencesRepository;
    }
    async put(deviceId, dto) {
        if (dto.country === WORLDWIDE && dto.city) {
            throw new AppError('INVALID_REQUEST', 'مينفعش تختار مدينة مع "أي مكان في العالم"', { retryable: false });
        }
        const saved = await this.preferencesRepository.upsert({
            deviceId,
            country: dto.country,
            city: dto.city ?? null,
            workTypes: dto.workTypes,
            willingToRelocate: dto.willingToRelocate ?? false,
        });
        return toDto(saved);
    }
    async getForDevice(device) {
        const saved = await this.preferencesRepository.findByDeviceId(device.id);
        if (saved) {
            return toDto(saved);
        }
        const region = device.region?.toUpperCase();
        return {
            country: /^[A-Z]{2}$/.test(region) ? region : 'EG',
            city: null,
            workTypes: [...WORK_TYPES],
            willingToRelocate: false,
        };
    }
};
PreferencesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PreferencesRepository])
], PreferencesService);
export { PreferencesService };
function toDto(preferences) {
    return {
        country: preferences.country,
        city: preferences.city,
        workTypes: preferences.workTypes,
        willingToRelocate: preferences.willingToRelocate,
    };
}
//# sourceMappingURL=preferences.service.js.map