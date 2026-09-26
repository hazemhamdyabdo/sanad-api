import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import type { Device } from '../device/index.js';
import { ApplicationsService } from './applications.service.js';
import type { ApplicationBatchDto, ApplicationDto, ApplicationsListDto } from './dto/application-response.dto.js';
import { CreateApplicationsDto } from './dto/create-applications.dto.js';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@CurrentDevice() device: Device, @Body() dto: CreateApplicationsDto): Promise<ApplicationBatchDto> {
    return this.applicationsService.create(device.id, dto.jobIds);
  }

  @Get()
  list(@CurrentDevice() device: Device): Promise<ApplicationsListDto> {
    return this.applicationsService.list(device.id);
  }

  @Get('batches/:batchId')
  getBatch(@CurrentDevice() device: Device, @Param('batchId') batchId: string): Promise<ApplicationBatchDto> {
    return this.applicationsService.getBatch(device.id, batchId);
  }

  @Post(':id/opened')
  @HttpCode(HttpStatus.OK)
  markOpened(@CurrentDevice() device: Device, @Param('id') id: string): Promise<ApplicationDto> {
    return this.applicationsService.markOpened(device.id, id);
  }

  @Post(':id/submitted')
  @HttpCode(HttpStatus.OK)
  markSubmitted(@CurrentDevice() device: Device, @Param('id') id: string): Promise<ApplicationDto> {
    return this.applicationsService.markSubmitted(device.id, id);
  }

  @Get(':id/cv')
  async getCv(@CurrentDevice() device: Device, @Param('id') id: string, @Res() response: Response): Promise<void> {
    const { file, filename } = await this.applicationsService.getCvPdf(device.id, id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': file.length.toString(),
    });
    response.end(file);
  }
}
