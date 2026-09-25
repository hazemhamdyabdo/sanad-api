import { createHash } from 'node:crypto';
import { EMBEDDING_DIMENSIONS, type EmbeddingProvider } from '../embedding.interface.js';

/**
 * No network calls, no cost — a hashed bag of words (each lowercase token hashed into one of the
 * 1024 slots, then L2-normalized). Not semantic, but deterministic, and texts sharing words really
 * do land closer together under cosine distance, so the whole matching pipeline (filters, pgvector
 * search, ranking) behaves meaningfully offline.
 */
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly model = 'fake-bow-1024';

  embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(texts.map((text) => this.embedOne(text)));
  }

  private embedOne(text: string): number[] {
    const vector: number[] = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
    const tokens = text.toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) ?? [];
    for (const token of tokens) {
      const slot = createHash('md5').update(token).digest().readUInt32BE(0) % EMBEDDING_DIMENSIONS;
      vector[slot] += 1;
    }
    const norm = Math.hypot(...vector) || 1;
    return vector.map((value) => value / norm);
  }
}
