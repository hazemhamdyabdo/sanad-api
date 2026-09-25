import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import type { EmailProvider, OutgoingEmail, SentEmail } from '../email.interface.js';

/**
 * Sends nothing. Writes each email to ./tmp/outbox/<idempotencyKey>/ — headers, text, HTML and the
 * attachments themselves — so exactly what a company would receive can be opened and checked
 * offline. Same key overwrites the same folder, mirroring a real provider's idempotency.
 */
export class FakeEmailProvider implements EmailProvider {
  private readonly logger = new Logger(FakeEmailProvider.name);
  constructor(private readonly outboxDir = join(process.cwd(), 'tmp', 'outbox')) {}

  async send(email: OutgoingEmail): Promise<SentEmail> {
    const dir = join(this.outboxDir, email.idempotencyKey.replace(/[^\w-]/g, '_'));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'headers.json'), JSON.stringify({ from: email.from, to: email.to, replyTo: email.replyTo, subject: email.subject }, null, 2));
    await writeFile(join(dir, 'message.txt'), email.text);
    await writeFile(join(dir, 'message.html'), email.html);
    for (const attachment of email.attachments) {
      await writeFile(join(dir, attachment.filename.replace(/[^\w.-]/g, '_')), attachment.content);
    }
    this.logger.log(`Fake email written to ${dir} (nothing was sent).`);
    return { messageId: `fake-${email.idempotencyKey}` };
  }
}
