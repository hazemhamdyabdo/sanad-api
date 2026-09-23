import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { DeviceService, type Device } from '../../modules/device/index.js';
import { AppError } from '../errors/app-error.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SKIP_DEVICE_LOOKUP_KEY } from '../decorators/skip-device-lookup.decorator.js';

export const DEVICE_ID_HEADER = 'x-device-id';

export interface RequestWithDevice extends Request {
  deviceId: string;
  device?: Device;
}

/**
 * Global guard: validates X-Device-Id and resolves it to a Device row.
 * @Public() skips it entirely (e.g. health checks). @SkipDeviceLookup()
 * still requires and validates the header but skips the DB lookup — for
 * POST /devices, the route that creates the row in the first place.
 */
@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly deviceService: DeviceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithDevice>();
    const deviceId = request.header(DEVICE_ID_HEADER);

    if (!deviceId) {
      throw new AppError('DEVICE_REQUIRED', 'محتاجين نتعرف على جهازك الأول', { retryable: false });
    }
    if (!isUUID(deviceId, 4)) {
      throw new AppError('INVALID_REQUEST', 'معرّف الجهاز مش بالشكل الصحيح', { retryable: false });
    }
    request.deviceId = deviceId;

    const skipLookup = this.reflector.getAllAndOverride<boolean>(SKIP_DEVICE_LOOKUP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipLookup) {
      return true;
    }

    const device = await this.deviceService.findById(deviceId);
    if (!device) {
      throw new AppError('NOT_FOUND', 'الجهاز ده مش متسجل، سجله الأول', { retryable: false });
    }
    request.device = device;
    return true;
  }
}
