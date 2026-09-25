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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity.js';
let DeviceRepository = class DeviceRepository {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    findById(id) {
        return this.repo.findOneBy({ id });
    }
    async upsert(input) {
        await this.repo.upsert(input, { conflictPaths: ['id'] });
    }
};
DeviceRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Device)),
    __metadata("design:paramtypes", [Repository])
], DeviceRepository);
export { DeviceRepository };
//# sourceMappingURL=device.repository.js.map