var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMBEDDING_PROVIDER } from './embedding.interface.js';
import { FakeEmbeddingProvider } from './providers/fake.provider.js';
import { MistralEmbeddingProvider } from './providers/mistral.provider.js';
const logger = new Logger('EmbeddingModule');
let EmbeddingModule = class EmbeddingModule {
};
EmbeddingModule = __decorate([
    Module({
        imports: [ConfigModule],
        providers: [
            {
                provide: EMBEDDING_PROVIDER,
                inject: [ConfigService],
                useFactory: (configService) => {
                    const provider = configService.get('ai.embeddingProvider');
                    if (provider === 'mistral') {
                        const apiKey = configService.get('ai.apiKey', '');
                        if (!apiKey) {
                            throw new Error('EMBEDDING_PROVIDER=mistral but AI_API_KEY is missing — refusing to start.');
                        }
                        const model = configService.get('ai.embeddingModel', '');
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
], EmbeddingModule);
export { EmbeddingModule };
//# sourceMappingURL=embedding.module.js.map