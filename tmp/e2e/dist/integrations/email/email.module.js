var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER } from './email.interface.js';
import { FakeEmailProvider } from './providers/fake.provider.js';
import { ResendEmailProvider } from './providers/resend.provider.js';
const logger = new Logger('EmailModule');
class RedirectingEmailProvider {
    inner;
    redirectTo;
    constructor(inner, redirectTo) {
        this.inner = inner;
        this.redirectTo = redirectTo;
    }
    send(email) {
        return this.inner.send({ ...email, to: this.redirectTo, subject: `[TEST → ${email.to}] ${email.subject}` });
    }
}
let EmailModule = class EmailModule {
};
EmailModule = __decorate([
    Module({
        imports: [ConfigModule],
        providers: [
            {
                provide: EMAIL_PROVIDER,
                inject: [ConfigService],
                useFactory: (configService) => {
                    const provider = configService.get('email.provider');
                    const redirectTo = configService.get('email.redirectTo', null);
                    let base;
                    if (provider === 'resend') {
                        const apiKey = configService.get('email.resendApiKey', '');
                        if (!apiKey) {
                            throw new Error('EMAIL_PROVIDER=resend but RESEND_API_KEY is missing — refusing to start.');
                        }
                        base = new ResendEmailProvider(apiKey);
                    }
                    else if (provider === 'fake') {
                        base = new FakeEmailProvider();
                    }
                    else {
                        throw new Error(`Unknown EMAIL_PROVIDER "${String(provider)}" — expected "resend" or "fake".`);
                    }
                    if (redirectTo) {
                        logger.warn(`Active email provider: ${provider} — REDIRECTED: every application email goes to the EMAIL_REDIRECT_TO address, not to companies.`);
                        return new RedirectingEmailProvider(base, redirectTo);
                    }
                    logger.log(provider === 'resend' ? 'Active email provider: resend — application emails go to real companies.' : 'Active email provider: fake (emails written to ./tmp/outbox, nothing sent).');
                    return base;
                },
            },
        ],
        exports: [EMAIL_PROVIDER],
    })
], EmailModule);
export { EmailModule };
//# sourceMappingURL=email.module.js.map