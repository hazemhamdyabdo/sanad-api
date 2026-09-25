import { Logger } from '@nestjs/common';
const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
export class ResendEmailProvider {
    apiKey;
    logger = new Logger(ResendEmailProvider.name);
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async send(email) {
        const response = await fetch(RESEND_EMAILS_URL, {
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
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Resend API error ${response.status}: ${body}`);
        }
        const data = (await response.json());
        this.logger.log(`Sent application email (resend id ${data.id ?? '?'}).`);
        return { messageId: data.id ?? '' };
    }
}
//# sourceMappingURL=resend.provider.js.map