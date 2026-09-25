import { AppError } from './app-error.js';
import type { ErrorCode } from './error-codes.js';

export interface ErrorBody {
  code: ErrorCode;
  message: string;
  retryable: boolean;
}

export const INTERNAL_ERROR_BODY: ErrorBody = {
  code: 'INTERNAL',
  message: 'حصلت مشكلة عندنا، جرّب تاني كمان شوية',
  retryable: true,
};

/** Shared by AllExceptionsFilter and the SSE `error` event — same mapping, same wording either way. */
export function toErrorBody(exception: unknown): ErrorBody {
  if (exception instanceof AppError) {
    return { code: exception.code, message: exception.message, retryable: exception.retryable };
  }
  return INTERNAL_ERROR_BODY;
}
