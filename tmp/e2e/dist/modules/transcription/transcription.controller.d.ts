import type { Device } from '../device/index.js';
import { CreateTranscriptionDto } from './dto/create-transcription.dto.js';
import type { TranscriptionResponseDto } from './dto/transcription-response.dto.js';
import { TranscriptionService } from './transcription.service.js';
import type { UploadedAudio } from './uploaded-audio.js';
export declare class TranscriptionController {
    private readonly transcriptionService;
    constructor(transcriptionService: TranscriptionService);
    create(device: Device, audio: UploadedAudio | undefined, dto: CreateTranscriptionDto): Promise<TranscriptionResponseDto>;
}
