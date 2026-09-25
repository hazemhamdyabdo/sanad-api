import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { LocalStorageProvider } from './providers/local.provider.js';
import { STORAGE_PROVIDER } from './storage.interface.js';

/** Gitignored, created on first write — see `.gitignore` and `LocalStorageProvider`. */
const LOCAL_STORAGE_DIR = join(process.cwd(), 'uploads');

@Module({
  providers: [{ provide: STORAGE_PROVIDER, useValue: new LocalStorageProvider(LOCAL_STORAGE_DIR) }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
