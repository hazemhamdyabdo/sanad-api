import { createParamDecorator } from '@nestjs/common';
export const DeviceId = createParamDecorator((_, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.deviceId;
});
//# sourceMappingURL=device-id.decorator.js.map