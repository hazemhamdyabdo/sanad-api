var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../../ai/index.js';
import { CvModule } from '../cv/index.js';
import { UploadModule } from '../upload/index.js';
import { ConversationController } from './conversation.controller.js';
import { ConversationRepository } from './conversation.repository.js';
import { ConversationService } from './conversation.service.js';
import { ConversationSession } from './entities/conversation-session.entity.js';
import { Message } from './entities/message.entity.js';
let ConversationModule = class ConversationModule {
};
ConversationModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([ConversationSession, Message]), CvModule, UploadModule, AiModule],
        controllers: [ConversationController],
        providers: [ConversationService, ConversationRepository],
        exports: [ConversationService],
    })
], ConversationModule);
export { ConversationModule };
//# sourceMappingURL=conversation.module.js.map