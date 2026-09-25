import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-codes.js';
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly retryable: boolean;
    readonly statusCode: HttpStatus;
    constructor(code: ErrorCode, message: string, options?: {
        retryable?: boolean;
    });
}
