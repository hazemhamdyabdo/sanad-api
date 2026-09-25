var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AppError } from '../errors/app-error.js';
import { RawResponseException } from '../errors/raw-response.exception.js';
import { INTERNAL_ERROR_BODY, toErrorBody } from '../errors/to-error-body.js';
const GENERIC_BY_STATUS = {
    [HttpStatus.BAD_REQUEST]: {
        code: 'INVALID_REQUEST',
        message: 'البيانات اللي بعتها مش صحيحة',
        retryable: false,
    },
    [HttpStatus.NOT_FOUND]: {
        code: 'NOT_FOUND',
        message: 'الحاجة اللي بتدور عليها مش موجودة',
        retryable: false,
    },
    [HttpStatus.PAYLOAD_TOO_LARGE]: {
        code: 'UNSUPPORTED_FILE',
        message: 'الملف أكبر من الحجم المسموح',
        retryable: false,
    },
    [HttpStatus.TOO_MANY_REQUESTS]: {
        code: 'RATE_LIMITED',
        message: 'في طلبات كتير دلوقتي، استنى شوية وجرب تاني',
        retryable: true,
    },
};
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const response = host.switchToHttp().getResponse();
        if (exception instanceof AppError) {
            response.status(exception.statusCode).json({ error: toErrorBody(exception) });
            return;
        }
        if (exception instanceof RawResponseException) {
            response.status(exception.getStatus()).json(exception.getResponse());
            return;
        }
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            this.logger.warn(exception.getResponse());
            response.status(status).json({ error: GENERIC_BY_STATUS[status] ?? INTERNAL_ERROR_BODY });
            return;
        }
        this.logger.error(exception instanceof Error ? exception.stack : exception);
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: INTERNAL_ERROR_BODY });
    }
};
AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    Catch()
], AllExceptionsFilter);
export { AllExceptionsFilter };
//# sourceMappingURL=all-exceptions.filter.js.map