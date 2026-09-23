import { HttpException } from '@nestjs/common';

/**
 * Escape hatch for a response that isn't the standard {error:{code,message,retryable}}
 * envelope — e.g. POST /conversations' 409, which carries an `activeSessionId`
 * the client acts on. AllExceptionsFilter passes its body through verbatim.
 */
export class RawResponseException extends HttpException {
  constructor(status: number, body: Record<string, unknown>) {
    super(body, status);
  }
}
