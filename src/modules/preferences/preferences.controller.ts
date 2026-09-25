import { Body, Controller, Put } from '@nestjs/common';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import type { Device } from '../device/index.js';
import type { PreferencesResponseDto } from './dto/preferences-response.dto.js';
import { PutPreferencesDto } from './dto/put-preferences.dto.js';
import { PreferencesService } from './preferences.service.js';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Put()
  put(@CurrentDevice() device: Device, @Body() dto: PutPreferencesDto): Promise<PreferencesResponseDto> {
    return this.preferencesService.put(device.id, dto);
  }
}
