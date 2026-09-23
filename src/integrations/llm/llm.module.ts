import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLM_PROVIDER, type LlmProvider } from './llm.interface.js';
import { FakeLlmProvider } from './providers/fake.provider.js';
import { MistralProvider } from './providers/mistral.provider.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): LlmProvider => {
        const provider = configService.get<string>('ai.llmProvider');
        if (provider === 'mistral') {
          return new MistralProvider(configService.get<string>('ai.apiKey', ''), configService.get<string>('ai.model', ''));
        }
        return new FakeLlmProvider();
      },
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
