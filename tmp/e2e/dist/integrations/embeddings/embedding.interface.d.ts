export declare const EMBEDDING_DIMENSIONS = 1024;
export interface EmbeddingProvider {
    readonly model: string;
    embed(texts: string[]): Promise<number[][]>;
}
export declare const EMBEDDING_PROVIDER: unique symbol;
