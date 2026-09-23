import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { ConversationSession } from './entities/conversation-session.entity.js';
import { Message } from './entities/message.entity.js';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectRepository(ConversationSession) private readonly sessionRepo: Repository<ConversationSession>,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
  ) {}

  create(session: Omit<ConversationSession, 'createdAt' | 'updatedAt'>): Promise<ConversationSession> {
    return this.sessionRepo.save(session);
  }

  findActiveByDeviceId(deviceId: string): Promise<ConversationSession | null> {
    return this.sessionRepo.findOneBy({ deviceId, status: 'in_progress' });
  }

  findById(id: string): Promise<ConversationSession | null> {
    return this.sessionRepo.findOneBy({ id });
  }

  saveSession(session: ConversationSession, manager?: EntityManager): Promise<ConversationSession> {
    return this.scoped(this.sessionRepo, manager).save(session);
  }

  async deleteById(id: string, manager?: EntityManager): Promise<void> {
    await this.scoped(this.sessionRepo, manager).delete(id);
  }

  findMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return this.messageRepo.find({ where: { sessionId }, order: { sequence: 'ASC' } });
  }

  findMessageById(id: string): Promise<Message | null> {
    return this.messageRepo.findOneBy({ id });
  }

  createMessage(message: Omit<Message, 'sequence' | 'createdAt'>): Promise<Message> {
    return this.messageRepo.save(message);
  }

  /** Binds a repository to a shared transaction manager when one is given, otherwise uses the module's own connection. */
  private scoped<T extends object>(repo: Repository<T>, manager?: EntityManager): Repository<T> {
    return manager ? manager.withRepository(repo) : repo;
  }
}
