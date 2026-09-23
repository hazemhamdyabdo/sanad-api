import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithDeviceId } from '../guards/device.guard.js';

/**
 * Returns the device id attached by DeviceGuard. Will return the resolved
 * Device row instead once the device module exists.
 */
export const CurrentDevice = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<RequestWithDeviceId>();
  return request.deviceId;
});
