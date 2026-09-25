import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from './embedding.interface.js';
import { FakeEmbeddingProvider } from './providers/fake.provider.js';
import { MistralEmbeddingProvider } from './providers/mistral.provider.js';

const logger = new Logger('EmbeddingModule');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMBEDDING_PROVIDER,
      inject: [ConfigService],
      // No fallback branch, same reasoning as LlmModule: `ai.embeddingProvider` is validated by
      // env.schema.ts before boot, so anything else here should crash loudly.
      useFactory: (configService: ConfigService): EmbeddingProvider => {
        const provider = configService.get<string>('ai.embeddingProvider');

        if (provider === 'mistral') {
          const apiKey = configService.get<string>('ai.apiKey', '');
          if (!apiKey) {
            throw new Error('EMBEDDING_PROVIDER=mistral but AI_API_KEY is missing — refusing to start.');
          }
          const model = configService.get<string>('ai.embeddingModel', '');
          logger.log(`Active embedding provider: mistral (model: ${model})`);
          return new MistralEmbeddingProvider(apiKey, model);
        }

        if (provider === 'fake') {
          logger.log('Active embedding provider: fake (local hashed bag-of-words — set EMBEDDING_PROVIDER=mistral for real embeddings)');
          return new FakeEmbeddingProvider();
        }

        throw new Error(`Unknown EMBEDDING_PROVIDER "${String(provider)}" — expected "mistral" or "fake".`);
      },
    },
  ],
  exports: [EMBEDDING_PROVIDER],
})
export class EmbeddingModule {}
