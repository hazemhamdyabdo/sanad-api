import { Controller, Get, HttpCode, HttpStatus, Param, Post, UploadedFile as UploadedFileDecorator, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import type { Device } from '../device/index.js';
import type { UploadResponseDto } from './dto/upload-response.dto.js';
import type { UploadStatusResponseDto } from './dto/upload-status-response.dto.js';
import { MAX_UPLOAD_BYTES, UploadService } from './upload.service.js';
import type { UploadedFile } from './uploaded-file.js';

@Controller('cv/uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /** No `dest`/`storage` given, so multer keeps the file in memory — `UploadService` writes it to disk itself, only once the PDF check passes. */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  create(@CurrentDevice() device: Device, @UploadedFileDecorator() file: UploadedFile | undefined): Promise<UploadResponseDto> {
    return this.uploadService.create(device.id, file);
  }

  @Get(':uploadId')
  getStatus(@CurrentDevice() device: Device, @Param('uploadId') uploadId: string): Promise<UploadStatusResponseDto> {
    return this.uploadService.getStatus(uploadId, device.id);
  }
}
