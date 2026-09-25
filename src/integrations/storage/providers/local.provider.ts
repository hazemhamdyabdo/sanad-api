import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { StorageProvider } from '../storage.interface.js';

/**
 * Saves files under a local directory on disk — the "local now, S3-compatible later" storage
 * mentioned in AGENTS.md. The returned path is a filename only (never a full path back to the
 * caller), so a future S3 provider can return an object key in the exact same shape.
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly baseDir: string) {}

  async save(buffer: Buffer, filename: string): Promise<string> {
    await mkdir(this.baseDir, { recursive: true });
    const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
    const storedName = `${randomUUID()}${extension}`;
    await writeFile(join(this.baseDir, storedName), buffer);
    return storedName;
  }

  read(path: string): Promise<Buffer> {
    return readFile(join(this.baseDir, path));
  }

  async delete(path: string): Promise<void> {
    try {
      await rm(join(this.baseDir, path));
    } catch {
      // Best-effort — already gone, or never written; nothing to recover from if this fails.
    }
  }
}
