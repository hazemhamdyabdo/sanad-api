import type { Device } from '../device/index.js';
import type { PreferencesResponseDto } from './dto/preferences-response.dto.js';
import type { PutPreferencesDto } from './dto/put-preferences.dto.js';
import { PreferencesRepository } from './preferences.repository.js';
export declare class PreferencesService {
    private readonly preferencesRepository;
    constructor(preferencesRepository: PreferencesRepository);
    put(deviceId: string, dto: PutPreferencesDto): Promise<PreferencesResponseDto>;
    getForDevice(device: Device): Promise<PreferencesResponseDto>;
}
