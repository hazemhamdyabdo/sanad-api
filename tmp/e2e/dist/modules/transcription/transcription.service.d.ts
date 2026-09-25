import { type SttProvider } from '../../integrations/stt/stt.interface.js';
import { ConversationService } from '../conversation/index.js';
import type { TranscriptionResponseDto } from './dto/transcription-response.dto.js';
import type { UploadedAudio } from './uploaded-audio.js';
export declare class TranscriptionService {
    private readonly stt;
    private readonly conversationService;
    private readonly logger;
    constructor(stt: SttProvider, conversationService: ConversationService);
    transcribe(deviceId: string, audio: UploadedAudio | undefined, sessionId: string | undefined): Promise<TranscriptionResponseDto>;
}
