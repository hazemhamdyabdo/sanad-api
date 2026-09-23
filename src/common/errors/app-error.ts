import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-codes.js';

const STATUS_BY_CODE: Record<ErrorCode, HttpStatus> = {
  INVALID_REQUEST: HttpStatus.BAD_REQUEST,
  DEVICE_REQUIRED: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  UNSUPPORTED_FILE: HttpStatus.BAD_REQUEST,
  PARSING_FAILED: HttpStatus.UNPROCESSABLE_ENTITY,
  TRANSCRIPTION_FAILED: HttpStatus.BAD_GATEWAY,
  AI_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  INTERNAL: HttpStatus.INTERNAL_SERVER_ERROR,
};

/**
 * The one exception type business code should throw. Its shape maps 1:1 onto
 * the contract's error envelope — message is Egyptian Arabic and goes to the
 * client as-is.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly statusCode: HttpStatus;

  constructor(code: ErrorCode, message: string, options?: { retryable?: boolean }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.statusCode = STATUS_BY_CODE[code];
  }
}
