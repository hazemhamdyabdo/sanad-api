export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface OutgoingEmail {
  /** Full From header, e.g. `"Ahmed Hassan via Sanad" <apply@mail.example.com>`. */
  from: string;
  to: string;
  /** Where the recipient's reply goes — the candidate's own address, so companies answer them directly. */
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  attachments: EmailAttachment[];
  /**
   * Same key = same email: a provider that supports it must not send twice for one key (a retry
   * after a crash between "sent" and "recorded as sent" must not double-apply).
   */
  idempotencyKey: string;
}

export interface SentEmail {
  /** The provider's message id — kept on the application for tracing a delivery problem. */
  messageId: string;
}

/** The port for sending email. Same rule as every integration: no vendor SDK or raw response outside integrations/. */
export interface EmailProvider {
  send(email: OutgoingEmail): Promise<SentEmail>;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
