import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
export class FakeEmailProvider {
    outboxDir;
    logger = new Logger(FakeEmailProvider.name);
    constructor(outboxDir = join(process.cwd(), 'tmp', 'outbox')) {
        this.outboxDir = outboxDir;
    }
    async send(email) {
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
//# sourceMappingURL=fake.provider.js.map