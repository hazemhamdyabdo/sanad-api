export interface EmailAttachment {
    filename: string;
    content: Buffer;
    contentType: string;
}
export interface OutgoingEmail {
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    html: string;
    attachments: EmailAttachment[];
    idempotencyKey: string;
}
export interface SentEmail {
    messageId: string;
}
export interface EmailProvider {
    send(email: OutgoingEmail): Promise<SentEmail>;
}
export declare const EMAIL_PROVIDER: unique symbol;
