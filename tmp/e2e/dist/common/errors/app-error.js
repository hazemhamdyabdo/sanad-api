import { HttpStatus } from '@nestjs/common';
const STATUS_BY_CODE = {
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
export class AppError extends Error {
    code;
    retryable;
    statusCode;
    constructor(code, message, options) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.retryable = options?.retryable ?? false;
        this.statusCode = STATUS_BY_CODE[code];
    }
}
//# sourceMappingURL=app-error.js.map