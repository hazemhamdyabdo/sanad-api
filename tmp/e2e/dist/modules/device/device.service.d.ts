import { ConversationService } from '../conversation/index.js';
import { CvService } from '../cv/index.js';
import { DeviceRepository } from './device.repository.js';
import type { Device } from './entities/device.entity.js';
import type { RegisterDeviceDto } from './dto/register-device.dto.js';
import type { DeviceResponseDto } from './dto/device-response.dto.js';
export declare class DeviceService {
    private readonly deviceRepository;
    private readonly conversationService;
    private readonly cvService;
    constructor(deviceRepository: DeviceRepository, conversationService: ConversationService, cvService: CvService);
    findById(id: string): Promise<Device | null>;
    register(deviceId: string, dto: RegisterDeviceDto): Promise<DeviceResponseDto>;
    private toResponseDto;
}
