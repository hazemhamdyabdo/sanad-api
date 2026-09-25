import type { EmailProvider, OutgoingEmail, SentEmail } from '../email.interface.js';
export declare class FakeEmailProvider implements EmailProvider {
    private readonly outboxDir;
    private readonly logger;
    constructor(outboxDir?: string);
    send(email: OutgoingEmail): Promise<SentEmail>;
}
