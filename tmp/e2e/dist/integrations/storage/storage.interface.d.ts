export interface StorageProvider {
    save(buffer: Buffer, filename: string): Promise<string>;
    read(path: string): Promise<Buffer>;
    delete(path: string): Promise<void>;
}
export declare const STORAGE_PROVIDER: unique symbol;
