import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from '../errors/app-error.js';
import type { ErrorCode } from '../errors/error-codes.js';

interface ErrorBody {
  code: ErrorCode;
  message: string;
  retryable: boolean;
}

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
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: 'RATE_LIMITED',
    message: 'في طلبات كتير دلوقتي، استنى شوية وجرب تاني',
    retryable: true,
  },
};

const FALLBACK: ErrorBody = {
  code: 'INTERNAL',
  message: 'حصل خطأ غير متوقع، جرب تاني',
  retryable: true,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppError) {
      response.status(exception.statusCode).json({
        error: { code: exception.code, message: exception.message, retryable: exception.retryable },
      } satisfies { error: ErrorBody });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      this.logger.warn(exception.getResponse());
      response.status(status).json({ error: GENERIC_BY_STATUS[status] ?? FALLBACK });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: FALLBACK });
  }
}
