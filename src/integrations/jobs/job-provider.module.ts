import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JOB_PROVIDER, type JobProvider } from './job-provider.interface.js';
import { FakeJobProvider } from './providers/fake.provider.js';
import { JoobleProvider } from './providers/jooble.provider.js';

const logger = new Logger('JobProviderModule');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: JOB_PROVIDER,
      inject: [ConfigService],
      // Same reasoning as LlmModule/SttModule: no fallback branch — `jobs.provider` is validated by
      // env.schema.ts before boot, so anything else here should crash loudly rather than silently
      // handing the app the fake provider (and quietly never calling the real API at all).
      useFactory: (configService: ConfigService): JobProvider => {
        const provider = configService.get<string>('jobs.provider');

        if (provider === 'jooble') {
          const apiKey = configService.get<string>('jobs.joobleApiKey', '');
          if (!apiKey) {
            throw new Error('JOB_PROVIDER=jooble but JOOBLE_API_KEY is missing — refusing to start.');
          }
          logger.warn('Active job provider: jooble — REAL calls will spend the 500-lifetime-request budget. Every call is logged to job_search_calls.');
          return new JoobleProvider(apiKey);
        }

        if (provider === 'fake') {
          logger.log('Active job provider: fake (no real Jooble calls — set JOB_PROVIDER=jooble + JOOBLE_API_KEY to go live).');
          return new FakeJobProvider();
        }

        throw new Error(`Unknown JOB_PROVIDER "${String(provider)}" — expected "jooble" or "fake".`);
      },
    },
  ],
  exports: [JOB_PROVIDER],
})
export class JobProviderModule {}
