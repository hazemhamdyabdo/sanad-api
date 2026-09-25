var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EXTRACTION_LLM_PROVIDER, LLM_PROVIDER } from './llm.interface.js';
import { FakeLlmProvider } from './providers/fake.provider.js';
import { MistralProvider } from './providers/mistral.provider.js';
const logger = new Logger('LlmModule');
let LlmModule = class LlmModule {
};
LlmModule = __decorate([
    Module({
        imports: [ConfigModule],
        providers: [
            {
                provide: LLM_PROVIDER,
                inject: [ConfigService],
                useFactory: (configService) => {
                    const provider = configService.get('ai.llmProvider');
                    const model = configService.get('ai.model', '');
                    if (provider === 'mistral') {
                        const apiKey = configService.get('ai.apiKey', '');
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
                useFactory: (configService, conversationProvider) => {
                    if (configService.get('ai.llmProvider') !== 'mistral') {
                        return conversationProvider;
                    }
                    const model = configService.get('ai.extractionModel', '');
                    logger.log(`Extraction model: ${model}`);
                    return new MistralProvider(configService.get('ai.apiKey', ''), model);
                },
            },
        ],
        exports: [LLM_PROVIDER, EXTRACTION_LLM_PROVIDER],
    })
], LlmModule);
export { LlmModule };
//# sourceMappingURL=llm.module.js.map