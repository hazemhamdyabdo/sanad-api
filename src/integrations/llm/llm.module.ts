import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EXTRACTION_LLM_PROVIDER, LLM_PROVIDER, type LlmProvider } from './llm.interface.js';
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
    {
      provide: EXTRACTION_LLM_PROVIDER,
      inject: [ConfigService, LLM_PROVIDER],
      // Same vendor and key as LLM_PROVIDER, only the model differs. The fake provider already
      // recognizes the extraction prompt on its own, so it's simply reused.
      useFactory: (configService: ConfigService, conversationProvider: LlmProvider): LlmProvider => {
        if (configService.get<string>('ai.llmProvider') !== 'mistral') {
          return conversationProvider;
        }
        const model = configService.get<string>('ai.extractionModel', '');
        logger.log(`Extraction model: ${model}`);
        return new MistralProvider(configService.get<string>('ai.apiKey', ''), model);
      },
    },
  ],
  exports: [LLM_PROVIDER, EXTRACTION_LLM_PROVIDER],
})
export class LlmModule {}
