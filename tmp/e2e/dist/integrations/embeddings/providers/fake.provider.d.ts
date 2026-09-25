import { type EmbeddingProvider } from '../embedding.interface.js';
export declare class FakeEmbeddingProvider implements EmbeddingProvider {
    readonly model = "fake-bow-1024";
    embed(texts: string[]): Promise<number[][]>;
    private embedOne;
}
