import { createParamDecorator } from '@nestjs/common';
export const CurrentDevice = createParamDecorator((_, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.device;
});
//# sourceMappingURL=current-device.decorator.js.map