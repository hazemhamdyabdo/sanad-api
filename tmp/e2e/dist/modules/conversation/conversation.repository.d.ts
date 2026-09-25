import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { ConversationSession } from './entities/conversation-session.entity.js';
import { Message } from './entities/message.entity.js';
export declare class ConversationRepository {
    private readonly sessionRepo;
    private readonly messageRepo;
    constructor(sessionRepo: Repository<ConversationSession>, messageRepo: Repository<Message>);
    create(session: Omit<ConversationSession, 'createdAt' | 'updatedAt'>): Promise<ConversationSession>;
    findActiveByDeviceId(deviceId: string): Promise<ConversationSession | null>;
    findById(id: string): Promise<ConversationSession | null>;
    saveSession(session: ConversationSession, manager?: EntityManager): Promise<ConversationSession>;
    deleteById(id: string, manager?: EntityManager): Promise<void>;
    findMessagesBySessionId(sessionId: string): Promise<Message[]>;
    findMessageById(id: string): Promise<Message | null>;
    createMessage(message: Omit<Message, 'sequence' | 'createdAt'>, manager?: EntityManager): Promise<Message>;
    private scoped;
}
