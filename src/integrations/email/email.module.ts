import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER, type EmailProvider, type OutgoingEmail } from './email.interface.js';
import { FakeEmailProvider } from './providers/fake.provider.js';
import { ResendEmailProvider } from './providers/resend.provider.js';

const logger = new Logger('EmailModule');

/**
 * Dev safety net, applied here so no caller can forget it: every email goes to the redirect address
 * instead of its real recipient, and the subject says who it would have gone to.
 */
class RedirectingEmailProvider implements EmailProvider {
  constructor(
    private readonly inner: EmailProvider,
    private readonly redirectTo: string,
  ) {}

  send(email: OutgoingEmail) {
    return this.inner.send({ ...email, to: this.redirectTo, subject: `[TEST → ${email.to}] ${email.subject}` });
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService],
      // No fallback branch, same reasoning as LlmModule: `email.provider` is validated by env.schema.ts.
      useFactory: (configService: ConfigService): EmailProvider => {
        const provider = configService.get<string>('email.provider');
        const redirectTo = configService.get<string | null>('email.redirectTo', null);

        let base: EmailProvider;
        if (provider === 'resend') {
          const apiKey = configService.get<string>('email.resendApiKey', '');
          if (!apiKey) {
            throw new Error('EMAIL_PROVIDER=resend but RESEND_API_KEY is missing — refusing to start.');
          }
          base = new ResendEmailProvider(apiKey);
        } else if (provider === 'fake') {
          base = new FakeEmailProvider(configService.get<string>('EMAIL_OUTBOX_DIR', 'tmp/outbox'));
        } else {
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
export class EmailModule {}
