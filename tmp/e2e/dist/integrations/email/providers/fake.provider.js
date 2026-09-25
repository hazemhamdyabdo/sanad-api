import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
const OUTBOX_DIR = join(process.cwd(), 'tmp', 'outbox');
export class FakeEmailProvider {
    logger = new Logger(FakeEmailProvider.name);
    async send(email) {
        const dir = join(OUTBOX_DIR, email.idempotencyKey.replace(/[^\w-]/g, '_'));
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
//# sourceMappingURL=fake.provider.js.map