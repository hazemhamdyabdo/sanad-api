import { Logger } from '@nestjs/common';
import { fetchWithTimeout } from '../../../common/timeout.js';
import type {
  EmailProvider,
  OutgoingEmail,
  SentEmail,
} from '../email.interface.js';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
/** A one-attachment email posts in a couple of seconds; the idempotency key makes retrying a timed-out send safe. */
const REQUEST_TIMEOUT_MS = 30_000;

/** Resend's REST API over fetch — no SDK needed. `Idempotency-Key` makes a retried send a no-op on their side (24h window). */
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(private readonly apiKey: string) {}

  async send(email: OutgoingEmail): Promise<SentEmail> {
    const response = await fetchWithTimeout(
      RESEND_EMAILS_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': email.idempotencyKey,
        },
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          reply_to: email.replyTo,
          subject: email.subject,
          text: email.text,
          html: email.html,
          attachments: email.attachments.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content.toString('base64'),
            content_type: attachment.contentType,
          })),
        }),
      },
      REQUEST_TIMEOUT_MS,
      'Resend send',
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Resend API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as { id?: string };
    this.logger.log(`Sent application email (resend id ${data.id ?? '?'}).`);
    return { messageId: data.id ?? '' };
  }
}
