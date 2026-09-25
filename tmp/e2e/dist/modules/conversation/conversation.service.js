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
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CARD_SCHEMA_BY_SECTION } from '../../ai/index.js';
import { generateId } from '../../common/ids.js';
import { AppError } from '../../common/errors/app-error.js';
import { RawResponseException } from '../../common/errors/raw-response.exception.js';
import { DEFAULT_BUILD_SECTIONS, SECTION_LABELS } from '../../common/types/contract.js';
import { CvService } from '../cv/index.js';
import { UploadService } from '../upload/index.js';
import { ConversationRepository } from './conversation.repository.js';
import { toMessageResponseDto } from './dto/conversation-response.dto.js';
const SECTION_OPENING_MESSAGES = {
    basic: 'أهلًا! هساعدك تعمل CV محترم في دقايق، من غير ما تكتب ولا حرف. نبدأ بإيه اسمك؟',
    experience: 'تمام. نتكلم بقى عن خبرتك — اشتغلت قبل كده في أي مكان؟',
    projects: 'تمام، بما إنك لسه ما اشتغلتش، يبقى نتكلم عن أي مشاريع عملتها — في الكلية أو لوحدك؟',
    education: 'جميل. نتكلم عن تعليمك — اتخرجت في إيه ومن فين؟',
    certificates: 'حلو. عندك شهادات أو كورسات خدتها؟',
    skills: 'تمام. إيه أهم المهارات اللي تشتغل بيها؟',
    languages: 'آخر حاجة، اللغات اللي بتتكلمها وإيه مستواك فيها؟',
};
const CV_COMPLETE_MESSAGE = 'مبروك! خلصنا الـ CV بتاعك 🎉 تقدر تراجعه دلوقتي وتعدل أي حاجة قبل ما تحمّله.';
let ConversationService = class ConversationService {
    conversationRepository;
    cvService;
    uploadService;
    dataSource;
    constructor(conversationRepository, cvService, uploadService, dataSource) {
        this.conversationRepository = conversationRepository;
        this.cvService = cvService;
        this.uploadService = uploadService;
        this.dataSource = dataSource;
    }
    async create(deviceId, dto) {
        const uploadAnalysis = dto.mode === 'upload'
            ? dto.uploadId
                ? await this.uploadService.getCompletedAnalysis(dto.uploadId, deviceId)
                : null
            : null;
        if (dto.mode === 'upload' && !dto.uploadId) {
            throw new AppError('INVALID_REQUEST', 'لازم تبعت رقم ملف الـ CV اللي اتحلل', { retryable: false });
        }
        const existing = await this.conversationRepository.findActiveByDeviceId(deviceId);
        if (existing) {
            if (!dto.restart) {
                throw new RawResponseException(HttpStatus.CONFLICT, { activeSessionId: existing.id });
            }
            if (dto.mode === 'upload') {
                await this.conversationRepository.deleteById(existing.id);
            }
            else {
                await this.deleteSessionAndItsCv(existing);
            }
        }
        let sectionIds = DEFAULT_BUILD_SECTIONS;
        let cvId = null;
        if (dto.mode === 'upload') {
            const analysis = uploadAnalysis;
            sectionIds = DEFAULT_BUILD_SECTIONS.filter((id) => analysis.sectionConfidence[id] === 'low');
            if (analysis.sectionConfidence.projects === 'low' && !sectionIds.includes('projects')) {
                const experienceIndex = sectionIds.indexOf('experience');
                sectionIds.splice(experienceIndex === -1 ? 1 : experienceIndex, 0, 'projects');
            }
            cvId = (await this.cvService.getForDevice(deviceId)).cvId;
        }
        const sections = sectionIds.map((id) => ({
            id,
            label: SECTION_LABELS[id],
            status: 'pending',
        }));
        const currentSection = sections[0]?.id ?? null;
        const sessionStatus = currentSection ? 'in_progress' : 'completed';
        let openingText = currentSection ? SECTION_OPENING_MESSAGES[currentSection] : CV_COMPLETE_MESSAGE;
        if (dto.mode === 'upload' && currentSection === 'basic' && uploadAnalysis) {
            const basic = uploadAnalysis.cv.basic;
            if (!basic.title) {
                openingText = 'قرأنا اسمك من الملف. إيه المسمى الوظيفي بتاعك، أو الوظيفة اللي بتدور عليها؟';
            }
            else if (!basic.phone && !basic.email) {
                openingText = 'البيانات الأساسية واضحة، ناقص بس وسيلة تواصل. ممكن رقم موبايلك أو إيميلك؟';
            }
        }
        const session = await this.conversationRepository.create({
            id: generateId('cnv'),
            deviceId,
            mode: dto.mode,
            status: sessionStatus,
            currentSection,
            sections,
            uploadId: dto.mode === 'upload' ? (dto.uploadId ?? null) : null,
            cvId,
        });
        const openingMessage = await this.conversationRepository.createMessage({
            id: generateId('msg'),
            sessionId: session.id,
            role: 'ai',
            section: session.currentSection,
            type: 'text',
            text: openingText,
            card: null,
            quickReplies: null,
            source: null,
            audioDurationSec: null,
        });
        return this.toResponseDto(session, [openingMessage]);
    }
    async findByIdForDevice(sessionId, deviceId) {
        const session = await this.getOwnedSession(sessionId, deviceId);
        const messages = await this.conversationRepository.findMessagesBySessionId(session.id);
        return this.toResponseDto(session, messages);
    }
    async deleteByIdForDevice(sessionId, deviceId) {
        const session = await this.getOwnedSession(sessionId, deviceId);
        await this.deleteSessionAndItsCv(session);
    }
    async getActiveSessionSummary(deviceId) {
        const session = await this.conversationRepository.findActiveByDeviceId(deviceId);
        if (!session) {
            return { activeSessionId: null, completedSections: [], nextSection: null };
        }
        return {
            activeSessionId: session.id,
            completedSections: session.sections.filter((section) => section.status === 'confirmed').map((section) => section.id),
            nextSection: session.currentSection,
        };
    }
    async getActiveOwnedSession(sessionId, deviceId) {
        const session = await this.getOwnedSession(sessionId, deviceId);
        if (session.status !== 'in_progress') {
            throw new AppError('INVALID_REQUEST', 'الجلسة دي خلصت خلاص', { retryable: false });
        }
        return session;
    }
    async getMessageHistoryForPrompt(sessionId, section) {
        const messages = await this.conversationRepository.findMessagesBySessionId(sessionId);
        return messages
            .filter((message) => message.type === 'text' && message.text && message.section === section)
            .map((message) => ({ role: message.role === 'ai' ? 'assistant' : 'user', content: message.text }));
    }
    async getBestPriorSectionCard(sessionId, section) {
        const session = await this.conversationRepository.findById(sessionId);
        const messages = await this.conversationRepository.findMessagesBySessionId(sessionId);
        const cards = messages.filter((message) => message.type === 'section_card' && message.section === section && message.card !== null).map((message) => message.card);
        if (cards.length === 0) {
            if (session?.mode === 'upload' && session.uploadId) {
                const analysis = await this.cvService.getAnalysisForUpload(session.uploadId, session.deviceId);
                return analysis?.cv[section] ?? null;
            }
            return null;
        }
        const arrays = cards.filter((card) => Array.isArray(card));
        if (arrays.length > 0) {
            return arrays.reduce((best, card) => (card.length > best.length ? card : best));
        }
        return cards[cards.length - 1] ?? null;
    }
    async getSectionCardsForDevice(sessionId, deviceId) {
        const session = await this.getOwnedSession(sessionId, deviceId);
        const messages = await this.conversationRepository.findMessagesBySessionId(session.id);
        return messages
            .filter((message) => message.type === 'section_card' && message.card !== null)
            .map((message) => message.card);
    }
    appendUserMessage(session, dto) {
        return this.conversationRepository.createMessage({
            id: generateId('msg'),
            sessionId: session.id,
            role: 'user',
            section: session.currentSection,
            type: 'text',
            text: dto.text,
            card: null,
            quickReplies: null,
            source: dto.source,
            audioDurationSec: dto.audioDurationSec ?? null,
        });
    }
    appendAiTextMessage(session, reply) {
        return this.conversationRepository.createMessage({
            id: generateId('msg'),
            sessionId: session.id,
            role: 'ai',
            section: reply.section,
            type: 'text',
            text: reply.message,
            card: null,
            quickReplies: null,
            source: null,
            audioDurationSec: null,
        });
    }
    appendSectionCardMessage(session, reply) {
        return this.conversationRepository.createMessage({
            id: generateId('msg'),
            sessionId: session.id,
            role: 'ai',
            section: reply.section,
            type: 'section_card',
            text: null,
            card: reply.card,
            quickReplies: null,
            source: null,
            audioDurationSec: null,
        });
    }
    async switchExperienceToProjects(session) {
        const index = session.sections.findIndex((section) => section.id === 'experience');
        if (index === -1) {
            return;
        }
        session.sections[index] = { id: 'projects', label: SECTION_LABELS.projects, status: 'pending' };
        session.currentSection = 'projects';
        await this.conversationRepository.saveSession(session);
    }
    isLastSection(session, sectionId) {
        const index = session.sections.findIndex((section) => section.id === sectionId);
        return index !== -1 && index === session.sections.length - 1;
    }
    async confirmSection(sessionId, deviceId, sectionId, dto) {
        const session = await this.getActiveOwnedSession(sessionId, deviceId);
        if (session.currentSection !== sectionId) {
            throw new AppError('INVALID_REQUEST', 'السكشن ده مش اللي دورك عليه دلوقتي', { retryable: false });
        }
        const message = await this.conversationRepository.findMessageById(dto.messageId);
        if (!message || message.sessionId !== session.id) {
            throw new AppError('NOT_FOUND', 'الرسالة دي مش موجودة', { retryable: false });
        }
        if (message.type !== 'section_card' || message.section !== sectionId || message.card === null) {
            throw new AppError('INVALID_REQUEST', 'الرسالة دي مالهاش كارت للسكشن ده', { retryable: false });
        }
        const content = this.resolveSectionContent(sectionId, message.card, dto.edits);
        const sectionIndex = session.sections.findIndex((section) => section.id === sectionId);
        const nextSection = session.sections[sectionIndex + 1]?.id ?? null;
        const sessionStatus = nextSection === null ? 'completed' : 'in_progress';
        const { cvId, nextMessage } = await this.dataSource.transaction(async (manager) => {
            const result = await this.cvService.confirmSection(deviceId, session.cvId, sectionId, content, nextSection === null, manager);
            session.sections[sectionIndex] = { ...session.sections[sectionIndex], status: 'confirmed' };
            session.currentSection = nextSection;
            session.cvId = result.cvId;
            session.status = sessionStatus;
            await this.conversationRepository.saveSession(session, manager);
            const message = await this.conversationRepository.createMessage({
                id: generateId('msg'),
                sessionId: session.id,
                role: 'ai',
                section: nextSection,
                type: 'text',
                text: nextSection === null ? CV_COMPLETE_MESSAGE : SECTION_OPENING_MESSAGES[nextSection],
                card: null,
                quickReplies: null,
                source: null,
                audioDurationSec: null,
            }, manager);
            return { ...result, nextMessage: message };
        });
        return {
            section: sectionId,
            status: 'confirmed',
            nextSection,
            sessionStatus,
            cvId: sessionStatus === 'completed' ? cvId : null,
            nextMessage: toMessageResponseDto(nextMessage),
        };
    }
    resolveSectionContent(sectionId, card, edits) {
        if (edits === undefined || edits === null) {
            return card;
        }
        const result = CARD_SCHEMA_BY_SECTION[sectionId].safeParse(edits);
        if (!result.success) {
            throw new AppError('INVALID_REQUEST', 'التعديلات اللي بعتها مش بالشكل الصحيح', { retryable: false });
        }
        return result.data;
    }
    async getOwnedSession(sessionId, deviceId) {
        const session = await this.conversationRepository.findById(sessionId);
        if (!session || session.deviceId !== deviceId) {
            throw new AppError('NOT_FOUND', 'الجلسة دي مش موجودة', { retryable: false });
        }
        return session;
    }
    async deleteSessionAndItsCv(session) {
        await this.dataSource.transaction(async (manager) => {
            if (session.cvId) {
                await this.cvService.deleteById(session.cvId, manager);
            }
            await this.conversationRepository.deleteById(session.id, manager);
        });
    }
    toResponseDto(session, messages) {
        return {
            sessionId: session.id,
            mode: session.mode,
            sections: session.sections,
            currentSection: session.currentSection,
            messages: messages.map(toMessageResponseDto),
            status: session.status,
        };
    }
};
ConversationService = __decorate([
    Injectable(),
    __param(3, InjectDataSource()),
    __metadata("design:paramtypes", [ConversationRepository,
        CvService,
        UploadService,
        DataSource])
], ConversationService);
export { ConversationService };
//# sourceMappingURL=conversation.service.js.map