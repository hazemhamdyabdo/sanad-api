import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithDevice } from '../guards/device.guard.js';

/** The raw X-Device-Id header value — for POST /devices, which registers the row @CurrentDevice() would otherwise resolve. */
export const DeviceId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<RequestWithDevice>();
  return request.deviceId;
});
