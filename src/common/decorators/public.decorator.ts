import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Bypasses DeviceGuard entirely — no X-Device-Id required at all. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
