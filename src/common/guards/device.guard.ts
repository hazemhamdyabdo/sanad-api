import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { AppError } from '../errors/app-error.js';

export const DEVICE_ID_HEADER = 'x-device-id';

export interface RequestWithDeviceId extends Request {
  deviceId: string;
}

/**
 * Validates X-Device-Id and attaches it to the request. It does not yet
 * resolve a Device row — that lands once the Device entity is approved and
 * the device module exists (tracked in TODO.md).
 */
@Injectable()
export class DeviceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithDeviceId>();
    const deviceId = request.header(DEVICE_ID_HEADER);

    if (!deviceId) {
      throw new AppError('DEVICE_REQUIRED', 'محتاجين نتعرف على جهازك الأول', { retryable: false });
    }

    if (!isUUID(deviceId, 4)) {
      throw new AppError('INVALID_REQUEST', 'معرّف الجهاز مش بالشكل الصحيح', { retryable: false });
    }

    request.deviceId = deviceId;
    return true;
  }
}
