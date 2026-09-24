import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { RawResponseException } from '../errors/raw-response.exception.js';
import { INTERNAL_ERROR_BODY, toErrorBody, type ErrorBody } from '../errors/to-error-body.js';

const GENERIC_BY_STATUS: Record<number, ErrorBody> = {
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
  // Multer's size limit (e.g. an audio upload over 10MB) surfaces as a 413.
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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

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
}
