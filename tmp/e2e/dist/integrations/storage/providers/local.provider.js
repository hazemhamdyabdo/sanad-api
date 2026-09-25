import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export class LocalStorageProvider {
    baseDir;
    constructor(baseDir) {
        this.baseDir = baseDir;
    }
    async save(buffer, filename) {
        await mkdir(this.baseDir, { recursive: true });
        const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
        const storedName = `${randomUUID()}${extension}`;
        await writeFile(join(this.baseDir, storedName), buffer);
        return storedName;
    }
    read(path) {
        return readFile(join(this.baseDir, path));
    }
    async delete(path) {
        try {
            await rm(join(this.baseDir, path));
        }
        catch {
        }
    }
}
//# sourceMappingURL=local.provider.js.map