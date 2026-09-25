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
var TranscriptionService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error.js';
import { STT_PROVIDER } from '../../integrations/stt/stt.interface.js';
import { ConversationService } from '../conversation/index.js';
const TRANSCRIPTION_LANGUAGE = 'ar';
const ACCEPTED_MIME_TYPES = new Set(['audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave']);
const ACCEPTED_EXTENSIONS = new Set(['m4a', 'mp4', 'wav']);
const MAX_CONTEXT_TERMS = 100;
const MAX_CONTEXT_TERM_LENGTH = 40;
const MAX_CONTEXT_TERM_WORDS = 4;
let TranscriptionService = TranscriptionService_1 = class TranscriptionService {
    stt;
    conversationService;
    logger = new Logger(TranscriptionService_1.name);
    constructor(stt, conversationService) {
        this.stt = stt;
        this.conversationService = conversationService;
    }
    async transcribe(deviceId, audio, sessionId) {
        if (!audio || audio.size === 0) {
            throw new AppError('INVALID_REQUEST', 'مفيش تسجيل اتبعت، سجّل تاني', { retryable: false });
        }
        if (!isAcceptedAudio(audio)) {
            throw new AppError('UNSUPPORTED_FILE', 'نوع التسجيل ده مش مدعوم، جرب تسجّل تاني', { retryable: false });
        }
        const contextBias = sessionId ? toContextTerms(await this.conversationService.getSectionCardsForDevice(sessionId, deviceId)) : [];
        let result;
        try {
            result = await this.stt.transcribe({
                audio: audio.buffer,
                mimeType: normalizeAudioMime(audio),
                filename: audio.originalname || 'recording.m4a',
                language: TRANSCRIPTION_LANGUAGE,
                contextBias,
            });
        }
        catch (error) {
            this.logger.error(`Transcription provider failed: ${error instanceof Error ? error.message : String(error)}`);
            throw new AppError('TRANSCRIPTION_FAILED', 'مش قادرين نحوّل الكلام دلوقتي، جرب تاني', { retryable: true });
        }
        const text = result.text.trim();
        if (!text) {
            throw new AppError('TRANSCRIPTION_FAILED', 'مسمعناش كلام واضح في التسجيل، جرب تتكلم تاني', { retryable: true });
        }
        return { text, durationSec: Math.max(1, Math.round(result.durationSec ?? 0)) };
    }
};
TranscriptionService = TranscriptionService_1 = __decorate([
    Injectable(),
    __param(0, Inject(STT_PROVIDER)),
    __metadata("design:paramtypes", [Object, ConversationService])
], TranscriptionService);
export { TranscriptionService };
function isAcceptedAudio(audio) {
    const extension = audio.originalname.split('.').pop()?.toLowerCase() ?? '';
    return ACCEPTED_MIME_TYPES.has(audio.mimetype.toLowerCase()) || ACCEPTED_EXTENSIONS.has(extension);
}
function normalizeAudioMime(audio) {
    const extension = audio.originalname.split('.').pop()?.toLowerCase() ?? '';
    return extension === 'm4a' ? 'audio/mp4' : audio.mimetype;
}
function toContextTerms(cards) {
    const terms = new Set();
    const visit = (value, key) => {
        if (terms.size >= MAX_CONTEXT_TERMS)
            return;
        if (Array.isArray(value)) {
            value.forEach((item) => visit(item, key));
        }
        else if (value && typeof value === 'object') {
            Object.entries(value).forEach(([childKey, child]) => visit(child, childKey));
        }
        else if (typeof value === 'string' && key !== 'email' && key !== 'phone' && key !== 'bullets' && key !== 'description') {
            const term = value.trim();
            if (term && term.length <= MAX_CONTEXT_TERM_LENGTH && term.split(/\s+/).length <= MAX_CONTEXT_TERM_WORDS && !/\d{4,}|@/.test(term)) {
                terms.add(term);
            }
        }
    };
    cards.forEach((card) => visit(card, null));
    return [...terms];
}
//# sourceMappingURL=transcription.service.js.map