import type { EmailProvider, OutgoingEmail, SentEmail } from '../email.interface.js';
export declare class ResendEmailProvider implements EmailProvider {
    private readonly apiKey;
    private readonly logger;
    constructor(apiKey: string);
    send(email: OutgoingEmail): Promise<SentEmail>;
}
