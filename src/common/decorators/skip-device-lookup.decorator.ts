import { SetMetadata } from '@nestjs/common';

export const SKIP_DEVICE_LOOKUP_KEY = 'skipDeviceLookup';

/** X-Device-Id is still required and validated, but DeviceGuard won't look it up in the DB — for POST /devices, the route that creates the row. */
export const SkipDeviceLookup = () => SetMetadata(SKIP_DEVICE_LOOKUP_KEY, true);
