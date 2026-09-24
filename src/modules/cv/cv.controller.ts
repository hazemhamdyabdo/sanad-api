import { Body, Controller, Get, Patch } from '@nestjs/common';
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
}
