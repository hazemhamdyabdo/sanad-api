import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { STORAGE_PROVIDER, type StorageProvider } from '../../integrations/storage/storage.interface.js';
import { UploadRepository } from './upload.repository.js';

/** No queue/scheduler library in this project — a plain interval is enough for a single-instance phase-1 deploy. */
const SWEEP_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Purges `Upload` rows (and any file still on disk) past `expiresAt` — the TODO item this replaces.
 * Mostly a backstop for a job that never finished (the API restarted mid-analysis, so the file was
 * never deleted the normal way in `UploadService.processUpload`), but also sweeps old `done`/`failed`
 * rows: their file is already gone, but the row itself still carries `originalFileName`, which can
 * be a real name.
 */
@Injectable()
export class UploadCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UploadCleanupService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly uploadRepository: UploadRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.sweep().catch((error) => this.logger.error('Upload cleanup sweep failed', error instanceof Error ? error.stack : error));
    }, SWEEP_INTERVAL_MS);
    // Doesn't keep the process alive on its own — a graceful shutdown shouldn't have to wait for this.
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async sweep(): Promise<void> {
    const expired = await this.uploadRepository.findExpired();
    for (const upload of expired) {
      await this.storage.delete(upload.filePath);
      await this.uploadRepository.deleteById(upload.id);
    }
    if (expired.length > 0) {
      this.logger.log(`Cleaned up ${expired.length} expired upload(s).`);
    }
  }
}
