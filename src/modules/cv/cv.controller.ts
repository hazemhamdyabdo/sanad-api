import { Body, Controller, Get, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import type { Device } from '../device/index.js';
import { CvService } from './cv.service.js';
import type { CvResponseDto } from './dto/cv-response.dto.js';
import { PatchCvDto } from './dto/patch-cv.dto.js';

@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Get()
  getCv(@CurrentDevice() device: Device): Promise<CvResponseDto> {
    return this.cvService.getForDevice(device.id);
  }

  @Patch()
  patchCv(@CurrentDevice() device: Device, @Body() dto: PatchCvDto): Promise<CvResponseDto> {
    return this.cvService.patch(device.id, dto);
  }

  @Post('pdf')
  async exportPdf(@CurrentDevice() device: Device, @Res() response: Response): Promise<void> {
    const { file, filename } = await this.cvService.exportPdf(device.id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': file.length.toString(),
    });
    response.end(file);
  }
}
