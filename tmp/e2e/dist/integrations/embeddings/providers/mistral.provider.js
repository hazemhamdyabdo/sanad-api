import { Logger } from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '../embedding.interface.js';
const MISTRAL_EMBEDDINGS_URL = 'https://api.mistral.ai/v1/embeddings';
const BATCH_SIZE = 32;
export class MistralEmbeddingProvider {
    apiKey;
    model;
    logger = new Logger(MistralEmbeddingProvider.name);
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }
    async embed(texts) {
        const vectors = [];
        for (let start = 0; start < texts.length; start += BATCH_SIZE) {
            vectors.push(...(await this.embedBatch(texts.slice(start, start + BATCH_SIZE))));
        }
        return vectors;
    }
    async embedBatch(texts) {
        const response = await fetch(MISTRAL_EMBEDDINGS_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model, input: texts }),
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Mistral embeddings API error ${response.status}: ${body}`);
        }
        const data = (await response.json());
        if (data.usage) {
            this.logger.log(`usage: inputs=${texts.length} tokens=${data.usage.total_tokens} model=${this.model}`);
        }
        const vectors = [...data.data].sort((a, b) => a.index - b.index).map((item) => item.embedding);
        if (vectors.length !== texts.length || vectors.some((vector) => vector.length !== EMBEDDING_DIMENSIONS)) {
            throw new Error(`Mistral embeddings returned ${vectors.length} vector(s) of size ${vectors[0]?.length ?? 0} for ${texts.length} input(s); expected size ${EMBEDDING_DIMENSIONS}.`);
        }
        return vectors;
    }
}
//# sourceMappingURL=mistral.provider.js.map