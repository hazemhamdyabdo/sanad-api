import type { Response } from 'express';
import type { Device } from '../device/index.js';
import { ApplicationsService } from './applications.service.js';
import type { ApplicationBatchDto, ApplicationDto } from './dto/application-response.dto.js';
import { CreateApplicationsDto } from './dto/create-applications.dto.js';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(device: Device, dto: CreateApplicationsDto): Promise<ApplicationBatchDto>;
    list(device: Device): Promise<{
        applications: ApplicationDto[];
    }>;
    getBatch(device: Device, batchId: string): Promise<ApplicationBatchDto>;
    markOpened(device: Device, id: string): Promise<ApplicationDto>;
    getCv(device: Device, id: string, response: Response): Promise<void>;
}
