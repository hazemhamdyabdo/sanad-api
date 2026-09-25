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
import { Body, Controller, Put } from '@nestjs/common';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { PutPreferencesDto } from './dto/put-preferences.dto.js';
import { PreferencesService } from './preferences.service.js';
let PreferencesController = class PreferencesController {
    preferencesService;
    constructor(preferencesService) {
        this.preferencesService = preferencesService;
    }
    put(device, dto) {
        return this.preferencesService.put(device.id, dto);
    }
};
__decorate([
    Put(),
    __param(0, CurrentDevice()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, PutPreferencesDto]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "put", null);
PreferencesController = __decorate([
    Controller('preferences'),
    __metadata("design:paramtypes", [PreferencesService])
], PreferencesController);
export { PreferencesController };
//# sourceMappingURL=preferences.controller.js.map