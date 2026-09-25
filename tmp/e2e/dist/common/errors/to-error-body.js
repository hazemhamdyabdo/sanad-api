import { AppError } from './app-error.js';
export const INTERNAL_ERROR_BODY = {
    code: 'INTERNAL',
    message: 'حصلت مشكلة عندنا، جرّب تاني كمان شوية',
    retryable: true,
};
export function toErrorBody(exception) {
    if (exception instanceof AppError) {
        return { code: exception.code, message: exception.message, retryable: exception.retryable };
    }
    return INTERNAL_ERROR_BODY;
}
//# sourceMappingURL=to-error-body.js.map