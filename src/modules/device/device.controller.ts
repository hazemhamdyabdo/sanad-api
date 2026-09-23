import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DeviceId } from '../../common/decorators/device-id.decorator.js';
import { SkipDeviceLookup } from '../../common/decorators/skip-device-lookup.decorator.js';
import { DeviceService } from './device.service.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
import type { DeviceResponseDto } from './dto/device-response.dto.js';

@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @SkipDeviceLookup()
  register(@DeviceId() deviceId: string, @Body() dto: RegisterDeviceDto): Promise<DeviceResponseDto> {
    return this.deviceService.register(deviceId, dto);
  }
}
