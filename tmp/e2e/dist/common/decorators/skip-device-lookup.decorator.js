import { SetMetadata } from '@nestjs/common';
export const SKIP_DEVICE_LOOKUP_KEY = 'skipDeviceLookup';
export const SkipDeviceLookup = () => SetMetadata(SKIP_DEVICE_LOOKUP_KEY, true);
//# sourceMappingURL=skip-device-lookup.decorator.js.map