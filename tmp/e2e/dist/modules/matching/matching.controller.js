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
import { Controller, Get } from '@nestjs/common';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import { MatchingService } from './matching.service.js';
let MatchingController = class MatchingController {
    matchingService;
    constructor(matchingService) {
        this.matchingService = matchingService;
    }
    getMatches(device) {
        return this.matchingService.getMatches(device);
    }
};
__decorate([
    Get('matches'),
    __param(0, CurrentDevice()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "getMatches", null);
MatchingController = __decorate([
    Controller('jobs'),
    __metadata("design:paramtypes", [MatchingService])
], MatchingController);
export { MatchingController };
//# sourceMappingURL=matching.controller.js.map