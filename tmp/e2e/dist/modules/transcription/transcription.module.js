var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { SttModule } from '../../integrations/stt/stt.module.js';
import { ConversationModule } from '../conversation/index.js';
import { TranscriptionController } from './transcription.controller.js';
import { TranscriptionService } from './transcription.service.js';
let TranscriptionModule = class TranscriptionModule {
};
TranscriptionModule = __decorate([
    Module({
        imports: [SttModule, ConversationModule],
        controllers: [TranscriptionController],
        providers: [TranscriptionService],
    })
], TranscriptionModule);
export { TranscriptionModule };
//# sourceMappingURL=transcription.module.js.map