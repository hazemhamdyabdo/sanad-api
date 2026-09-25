var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { aiConfig, appConfig, databaseConfig, emailConfig, jobsConfig } from './config/configuration.js';
import { validateEnv } from './config/env.schema.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { DeviceGuard } from './common/guards/device.guard.js';
import { DatabaseModule } from './database/database.module.js';
import { LlmModule } from './integrations/llm/llm.module.js';
import { LlmDebugController } from './llm-debug.controller.js';
import { ConversationModule } from './modules/conversation/index.js';
import { ApplicationsModule } from './modules/applications/index.js';
import { CvModule } from './modules/cv/index.js';
import { DeviceModule } from './modules/device/index.js';
import { JobsModule } from './modules/jobs/index.js';
import { MatchingModule } from './modules/matching/index.js';
import { PreferencesModule } from './modules/preferences/index.js';
import { TranscriptionModule } from './modules/transcription/index.js';
import { UploadModule } from './modules/upload/index.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                validate: validateEnv,
                load: [appConfig, databaseConfig, aiConfig, jobsConfig, emailConfig],
            }),
            DatabaseModule,
            DeviceModule,
            ConversationModule,
            CvModule,
            TranscriptionModule,
            UploadModule,
            JobsModule,
            PreferencesModule,
            MatchingModule,
            ApplicationsModule,
            LlmModule,
        ],
        controllers: [AppController, LlmDebugController],
        providers: [
            AppService,
            { provide: APP_FILTER, useClass: AllExceptionsFilter },
            { provide: APP_GUARD, useClass: DeviceGuard },
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map