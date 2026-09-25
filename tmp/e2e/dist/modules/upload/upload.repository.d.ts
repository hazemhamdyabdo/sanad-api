import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity.js';
export declare class UploadRepository {
    private readonly uploadRepo;
    constructor(uploadRepo: Repository<Upload>);
    create(upload: Omit<Upload, 'createdAt'>): Promise<Upload>;
    findById(id: string): Promise<Upload | null>;
    save(upload: Upload): Promise<Upload>;
    findExpired(): Promise<Upload[]>;
    deleteById(id: string): Promise<void>;
}
