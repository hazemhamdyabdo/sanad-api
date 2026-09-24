import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import type { Device } from '../device/index.js';
import { CreateTranscriptionDto } from './dto/create-transcription.dto.js';
import type { TranscriptionResponseDto } from './dto/transcription-response.dto.js';
import { TranscriptionService } from './transcription.service.js';
import type { UploadedAudio } from './uploaded-audio.js';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

@Controller('transcriptions')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  /** No `dest`/`storage` given, so multer keeps the recording in memory — it's forwarded to the STT provider and never written to disk. */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } }))
  create(
    @CurrentDevice() device: Device,
    @UploadedFile() audio: UploadedAudio | undefined,
    @Body() dto: CreateTranscriptionDto,
  ): Promise<TranscriptionResponseDto> {
    return this.transcriptionService.transcribe(device.id, audio, dto.sessionId);
  }
}
