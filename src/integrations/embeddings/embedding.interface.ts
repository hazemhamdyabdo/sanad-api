/**
 * The size of every stored vector — the `vector(1024)` columns in the database are declared with it
 * (see the AddJobMatching migration), and it's mistral-embed's native output size. A provider
 * returning anything else is a configuration error, not something to silently pad or truncate.
 */
export const EMBEDDING_DIMENSIONS = 1024;

/**
 * The port for turning text into vectors. Same rule as every other integration: no vendor SDK or
 * raw response outside integrations/ — swapping providers is a one-file change in providers/ +
 * embedding.module.ts.
 */
export interface EmbeddingProvider {
  /** Stored next to every vector, so a model change is detectable and old vectors get recomputed instead of compared across models. */
  readonly model: string;
  /** One vector per input, same order, each exactly `EMBEDDING_DIMENSIONS` long. */
  embed(texts: string[]): Promise<number[][]>;
}

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');
