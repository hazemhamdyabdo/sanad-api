import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

  async deleteById(id: string): Promise<void> {
    await this.sessionRepo.delete(id);
  }

  findMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return this.messageRepo.find({ where: { sessionId }, order: { sequence: 'ASC' } });
  }

  createMessage(message: Omit<Message, 'sequence' | 'createdAt'>): Promise<Message> {
    return this.messageRepo.save(message);
  }
}
