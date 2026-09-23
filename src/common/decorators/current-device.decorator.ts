import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Device } from '../../modules/device/index.js';
import type { RequestWithDevice } from '../guards/device.guard.js';

/** The resolved Device row — only valid on routes DeviceGuard has fully resolved (i.e. not @SkipDeviceLookup() or @Public() ones). */
export const CurrentDevice = createParamDecorator((_: unknown, ctx: ExecutionContext): Device => {
  const request = ctx.switchToHttp().getRequest<RequestWithDevice>();
  return request.device as Device;
});
