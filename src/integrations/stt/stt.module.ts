import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FakeSttProvider } from './providers/fake.provider.js';
import { MistralSttProvider } from './providers/mistral.provider.js';
import { STT_PROVIDER, type SttProvider } from './stt.interface.js';

const logger = new Logger('SttModule');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STT_PROVIDER,
      inject: [ConfigService],
      // No fallback branch, same reasoning as LlmModule: `ai.sttProvider` is validated by
      // env.schema.ts before boot, so anything else here should crash loudly.
      useFactory: (configService: ConfigService): SttProvider => {
        const provider = configService.get<string>('ai.sttProvider');

        if (provider === 'mistral') {
          const apiKey = configService.get<string>('ai.apiKey', '');
          if (!apiKey) {
            throw new Error('STT_PROVIDER=mistral but AI_API_KEY is missing — refusing to start.');
          }
          const model = configService.get<string>('ai.sttModel', '');
          logger.log(`Active STT provider: mistral (model: ${model})`);
          return new MistralSttProvider(apiKey, model);
        }

        if (provider === 'fake') {
          logger.log('Active STT provider: fake (fixed transcript — set STT_PROVIDER=mistral for real transcription)');
          return new FakeSttProvider();
        }

        throw new Error(`Unknown STT_PROVIDER "${String(provider)}" — expected "mistral" or "fake".`);
      },
    },
  ],
  exports: [STT_PROVIDER],
})
export class SttModule {}
