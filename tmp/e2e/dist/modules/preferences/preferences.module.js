var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPreferences } from './entities/job-preferences.entity.js';
import { PreferencesController } from './preferences.controller.js';
import { PreferencesRepository } from './preferences.repository.js';
import { PreferencesService } from './preferences.service.js';
let PreferencesModule = class PreferencesModule {
};
PreferencesModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([JobPreferences])],
        controllers: [PreferencesController],
        providers: [PreferencesService, PreferencesRepository],
        exports: [PreferencesService],
    })
], PreferencesModule);
export { PreferencesModule };
//# sourceMappingURL=preferences.module.js.map