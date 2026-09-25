var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FakeSttProvider } from './providers/fake.provider.js';
import { MistralSttProvider } from './providers/mistral.provider.js';
import { STT_PROVIDER } from './stt.interface.js';
const logger = new Logger('SttModule');
let SttModule = class SttModule {
};
SttModule = __decorate([
    Module({
        imports: [ConfigModule],
        providers: [
            {
                provide: STT_PROVIDER,
                inject: [ConfigService],
                useFactory: (configService) => {
                    const provider = configService.get('ai.sttProvider');
                    if (provider === 'mistral') {
                        const apiKey = configService.get('ai.apiKey', '');
                        if (!apiKey) {
                            throw new Error('STT_PROVIDER=mistral but AI_API_KEY is missing — refusing to start.');
                        }
                        const model = configService.get('ai.sttModel', '');
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
], SttModule);
export { SttModule };
//# sourceMappingURL=stt.module.js.map