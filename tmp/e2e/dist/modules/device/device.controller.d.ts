import { DeviceService } from './device.service.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
import type { DeviceResponseDto } from './dto/device-response.dto.js';
export declare class DeviceController {
    private readonly deviceService;
    constructor(deviceService: DeviceService);
    register(deviceId: string, dto: RegisterDeviceDto): Promise<DeviceResponseDto>;
}
