import type { EmailProvider, OutgoingEmail, SentEmail } from '../email.interface.js';
export declare class FakeEmailProvider implements EmailProvider {
    private readonly logger;
    send(email: OutgoingEmail): Promise<SentEmail>;
}
