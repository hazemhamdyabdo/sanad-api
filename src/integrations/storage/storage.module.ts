import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './providers/local.provider.js';
import { STORAGE_PROVIDER } from './storage.interface.js';

@Module({
  imports: [ConfigModule],
  providers: [{
    provide: STORAGE_PROVIDER,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => new LocalStorageProvider(config.get<string>('UPLOAD_DIR', 'uploads')),
  }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
