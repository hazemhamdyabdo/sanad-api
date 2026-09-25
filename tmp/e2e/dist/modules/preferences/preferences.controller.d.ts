import type { Device } from '../device/index.js';
import type { PreferencesResponseDto } from './dto/preferences-response.dto.js';
import { PutPreferencesDto } from './dto/put-preferences.dto.js';
import { PreferencesService } from './preferences.service.js';
export declare class PreferencesController {
    private readonly preferencesService;
    constructor(preferencesService: PreferencesService);
    put(device: Device, dto: PutPreferencesDto): Promise<PreferencesResponseDto>;
}
