import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLM_PROVIDER, type LlmProvider } from './llm.interface.js';
import { FakeLlmProvider } from './providers/fake.provider.js';
import { MistralProvider } from './providers/mistral.provider.js';

const logger = new Logger('LlmModule');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      // Deliberately no default/fallback branch: `ai.llmProvider` is already validated
      // by env.schema.ts to be exactly "mistral" or "fake" before the app boots, so
      // anything else here means that validation was bypassed somehow — better to
      // crash loudly than silently hand the whole app the fake provider, which is
      // exactly the failure mode this used to have (a config value that resolved to
      // `undefined` fell through an `if (provider === 'mistral')` straight to
      // `new FakeLlmProvider()` with no log line and no error).
      useFactory: (configService: ConfigService): LlmProvider => {
        const provider = configService.get<string>('ai.llmProvider');
        const model = configService.get<string>('ai.model', '');

        if (provider === 'mistral') {
          const apiKey = configService.get<string>('ai.apiKey', '');
          if (!apiKey) {
            throw new Error('LLM_PROVIDER=mistral but AI_API_KEY is missing — refusing to start.');
          }
          logger.log(`Active LLM provider: mistral (model: ${model})`);
          return new MistralProvider(apiKey, model);
        }

        if (provider === 'fake') {
          logger.log('Active LLM provider: fake (no real model calls — set LLM_PROVIDER=mistral for real replies)');
          return new FakeLlmProvider();
        }

        throw new Error(`Unknown LLM_PROVIDER "${String(provider)}" — expected "mistral" or "fake".`);
      },
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
