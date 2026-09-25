var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JOB_PROVIDER } from './job-provider.interface.js';
import { FakeJobProvider } from './providers/fake.provider.js';
import { JoobleProvider } from './providers/jooble.provider.js';
const logger = new Logger('JobProviderModule');
let JobProviderModule = class JobProviderModule {
};
JobProviderModule = __decorate([
    Module({
        imports: [ConfigModule],
        providers: [
            {
                provide: JOB_PROVIDER,
                inject: [ConfigService],
                useFactory: (configService) => {
                    const provider = configService.get('jobs.provider');
                    if (provider === 'jooble') {
                        const apiKeys = configService.get('jobs.joobleApiKeys', {});
                        const countries = Object.keys(apiKeys).filter((country) => !!apiKeys[country]);
                        if (!countries.length) {
                            throw new Error('JOB_PROVIDER=jooble but no JOOBLE_API_KEY_<country> is set — refusing to start.');
                        }
                        logger.warn(`Active job provider: jooble (${countries.join(', ')}) — REAL calls will spend each key's 500-lifetime-request budget. Every call is logged to job_search_calls.`);
                        return new JoobleProvider(apiKeys);
                    }
                    if (provider === 'fake') {
                        logger.log('Active job provider: fake (no real Jooble calls — set JOB_PROVIDER=jooble + JOOBLE_API_KEY_<country> to go live).');
                        return new FakeJobProvider();
                    }
                    throw new Error(`Unknown JOB_PROVIDER "${String(provider)}" — expected "jooble" or "fake".`);
                },
            },
        ],
        exports: [JOB_PROVIDER],
    })
], JobProviderModule);
export { JobProviderModule };
//# sourceMappingURL=job-provider.module.js.map