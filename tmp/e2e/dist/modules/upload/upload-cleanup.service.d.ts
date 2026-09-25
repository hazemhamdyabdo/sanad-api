import { type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { type StorageProvider } from '../../integrations/storage/storage.interface.js';
import { UploadRepository } from './upload.repository.js';
export declare class UploadCleanupService implements OnModuleInit, OnModuleDestroy {
    private readonly uploadRepository;
    private readonly storage;
    private readonly logger;
    private timer;
    constructor(uploadRepository: UploadRepository, storage: StorageProvider);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private sweep;
}
