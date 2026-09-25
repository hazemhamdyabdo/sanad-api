import { createHash } from 'node:crypto';
import { EMBEDDING_DIMENSIONS } from '../embedding.interface.js';
export class FakeEmbeddingProvider {
    model = 'fake-bow-1024';
    embed(texts) {
        return Promise.resolve(texts.map((text) => this.embedOne(text)));
    }
    embedOne(text) {
        const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
        const tokens = text.toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) ?? [];
        for (const token of tokens) {
            const slot = createHash('md5').update(token).digest().readUInt32BE(0) % EMBEDDING_DIMENSIONS;
            vector[slot] += 1;
        }
        const norm = Math.hypot(...vector) || 1;
        return vector.map((value) => value / norm);
    }
}
//# sourceMappingURL=fake.provider.js.map