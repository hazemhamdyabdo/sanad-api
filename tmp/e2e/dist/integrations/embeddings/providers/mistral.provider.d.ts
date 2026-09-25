import { type EmbeddingProvider } from '../embedding.interface.js';
export declare class MistralEmbeddingProvider implements EmbeddingProvider {
    private readonly apiKey;
    readonly model: string;
    private readonly logger;
    constructor(apiKey: string, model: string);
    embed(texts: string[]): Promise<number[][]>;
    private embedBatch;
}
