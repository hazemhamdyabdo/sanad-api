import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error.js';
import { STT_PROVIDER, type SttProvider } from '../../integrations/stt/stt.interface.js';
import { ConversationService } from '../conversation/index.js';
import type { TranscriptionResponseDto } from './dto/transcription-response.dto.js';
import type { UploadedAudio } from './uploaded-audio.js';

/** Users speak Egyptian Arabic. Pinning the language beats auto-detection on short dialect clips, and doesn't stop English terms ("Excel", company names) coming back in Latin script. */
const TRANSCRIPTION_LANGUAGE = 'ar';

const ACCEPTED_MIME_TYPES = new Set(['audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave']);
const ACCEPTED_EXTENSIONS = new Set(['m4a', 'mp4', 'wav']);

const MAX_CONTEXT_TERMS = 100;
const MAX_CONTEXT_TERM_LENGTH = 40;
const MAX_CONTEXT_TERM_WORDS = 4;

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    @Inject(STT_PROVIDER) private readonly stt: SttProvider,
    private readonly conversationService: ConversationService,
  ) {}

  async transcribe(deviceId: string, audio: UploadedAudio | undefined, sessionId: string | undefined): Promise<TranscriptionResponseDto> {
    if (!audio || audio.size === 0) {
      throw new AppError('INVALID_REQUEST', 'مفيش تسجيل اتبعت، سجّل تاني', { retryable: false });
    }
    if (!isAcceptedAudio(audio)) {
      throw new AppError('UNSUPPORTED_FILE', 'نوع التسجيل ده مش مدعوم، جرب تسجّل تاني', { retryable: false });
    }

    // Ownership-checked up front so a bad sessionId fails like everywhere else in the API.
    const contextBias = sessionId ? toContextTerms(await this.conversationService.getSectionCardsForDevice(sessionId, deviceId)) : [];

    let result;
    try {
      result = await this.stt.transcribe({
        audio: audio.buffer,
        mimeType: audio.mimetype,
        filename: audio.originalname || 'recording.m4a',
        language: TRANSCRIPTION_LANGUAGE,
        contextBias,
      });
    } catch (error) {
      // Only the provider's error text is logged — never the audio or the transcript.
      this.logger.error(`Transcription provider failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new AppError('TRANSCRIPTION_FAILED', 'مش قادرين نحوّل الكلام دلوقتي، جرب تاني', { retryable: true });
    }

    const text = result.text.trim();
    if (!text) {
      throw new AppError('TRANSCRIPTION_FAILED', 'مسمعناش كلام واضح في التسجيل، جرب تتكلم تاني', { retryable: true });
    }

    return { text, durationSec: Math.max(1, Math.round(result.durationSec ?? 0)) };
  }
}

function isAcceptedAudio(audio: UploadedAudio): boolean {
  const extension = audio.originalname.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_MIME_TYPES.has(audio.mimetype.toLowerCase()) || ACCEPTED_EXTENSIONS.has(extension);
}

/**
 * Short, name-like strings from the session's cards (the user's name, companies,
 * schools, skills, languages) — the words most likely to be misheard on the next
 * recording. Emails, phone numbers, and sentence-length bullets are skipped.
 */
function toContextTerms(cards: Array<Record<string, unknown> | unknown[]>): string[] {
  const terms = new Set<string>();

  const visit = (value: unknown, key: string | null): void => {
    if (terms.size >= MAX_CONTEXT_TERMS) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key));
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([childKey, child]) => visit(child, childKey));
    } else if (typeof value === 'string' && key !== 'email' && key !== 'phone' && key !== 'bullets' && key !== 'description') {
      const term = value.trim();
      if (term && term.length <= MAX_CONTEXT_TERM_LENGTH && term.split(/\s+/).length <= MAX_CONTEXT_TERM_WORDS && !/\d{4,}|@/.test(term)) {
        terms.add(term);
      }
    }
  };

  cards.forEach((card) => visit(card, null));
  return [...terms];
}
