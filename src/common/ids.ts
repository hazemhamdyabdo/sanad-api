import { randomUUID } from 'node:crypto';

/**
 * Opaque, prefixed ids for everything except Device (whose id is the
 * client-generated X-Device-Id). e.g. generateId('cnv') -> "cnv_3e6b6c8e...".
 */
export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}
