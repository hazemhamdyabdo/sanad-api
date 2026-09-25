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
import { ConversationSession } from './entities/conversation-session.entity.js';
import { Message } from './entities/message.entity.js';
let ConversationRepository = class ConversationRepository {
    sessionRepo;
    messageRepo;
    constructor(sessionRepo, messageRepo) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
    }
    create(session) {
        return this.sessionRepo.save(session);
    }
    findActiveByDeviceId(deviceId) {
        return this.sessionRepo.findOneBy({ deviceId, status: 'in_progress' });
    }
    findById(id) {
        return this.sessionRepo.findOneBy({ id });
    }
    saveSession(session, manager) {
        return this.scoped(this.sessionRepo, manager).save(session);
    }
    async deleteById(id, manager) {
        await this.scoped(this.sessionRepo, manager).delete(id);
    }
    findMessagesBySessionId(sessionId) {
        return this.messageRepo.find({ where: { sessionId }, order: { sequence: 'ASC' } });
    }
    findMessageById(id) {
        return this.messageRepo.findOneBy({ id });
    }
    createMessage(message, manager) {
        return this.scoped(this.messageRepo, manager).save(message);
    }
    scoped(repo, manager) {
        return manager ? manager.withRepository(repo) : repo;
    }
};
ConversationRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(ConversationSession)),
    __param(1, InjectRepository(Message)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], ConversationRepository);
export { ConversationRepository };
//# sourceMappingURL=conversation.repository.js.map