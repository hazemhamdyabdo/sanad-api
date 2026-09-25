import { Repository } from 'typeorm';
import { Device } from './entities/device.entity.js';
export interface UpsertDeviceInput {
    id: string;
    platform: string;
    appVersion: string;
    locale: string;
    region: string;
}
export declare class DeviceRepository {
    private readonly repo;
    constructor(repo: Repository<Device>);
    findById(id: string): Promise<Device | null>;
    upsert(input: UpsertDeviceInput): Promise<void>;
}
