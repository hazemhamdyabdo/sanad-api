import { randomUUID } from 'node:crypto';
export function generateId(prefix) {
    return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}
//# sourceMappingURL=ids.js.map