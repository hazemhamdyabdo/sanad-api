import type { ErrorCode } from './error-codes.js';
export interface ErrorBody {
    code: ErrorCode;
    message: string;
    retryable: boolean;
}
export declare const INTERNAL_ERROR_BODY: ErrorBody;
export declare function toErrorBody(exception: unknown): ErrorBody;
