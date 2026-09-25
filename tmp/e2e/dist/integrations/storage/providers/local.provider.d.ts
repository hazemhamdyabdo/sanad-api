import type { StorageProvider } from '../storage.interface.js';
export declare class LocalStorageProvider implements StorageProvider {
    private readonly baseDir;
    constructor(baseDir: string);
    save(buffer: Buffer, filename: string): Promise<string>;
    read(path: string): Promise<Buffer>;
    delete(path: string): Promise<void>;
}
