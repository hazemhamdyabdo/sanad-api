import { Logger } from '@nestjs/common';
import { fetchWithTimeout } from '../../../common/timeout.js';
import {
  EMBEDDING_DIMENSIONS,
  type EmbeddingProvider,
} from '../embedding.interface.js';

const MISTRAL_EMBEDDINGS_URL = 'https://api.mistral.ai/v1/embeddings';
/** Keeps each request well under the endpoint's per-request token ceiling — job texts are a few hundred tokens each. */
const BATCH_SIZE = 32;
/** One batch of 32 short texts normally embeds in a second or two — anything past this is a hung connection, not a slow one. */
const REQUEST_TIMEOUT_MS = 30_000;

interface MistralEmbeddingResponse {
  data: Array<{ index: number; embedding: number[] }>;
  usage?: { prompt_tokens: number; total_tokens: number };
}

/** Talks to Mistral's embeddings API directly over fetch, same as the chat provider — no SDK needed. */
export class MistralEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(MistralEmbeddingProvider.name);

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
      vectors.push(
        ...(await this.embedBatch(texts.slice(start, start + BATCH_SIZE))),
      );
    }
    return vectors;
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetchWithTimeout(
      MISTRAL_EMBEDDINGS_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: this.model, input: texts }),
      },
      REQUEST_TIMEOUT_MS,
      `Mistral embeddings (${this.model})`,
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Mistral embeddings API error ${response.status}: ${body}`,
      );
    }

    const data = (await response.json()) as MistralEmbeddingResponse;
    if (data.usage) {
      this.logger.log(
        `usage: inputs=${texts.length} tokens=${data.usage.total_tokens} model=${this.model}`,
      );
    }

    const vectors = [...data.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
    if (
      vectors.length !== texts.length ||
      vectors.some((vector) => vector.length !== EMBEDDING_DIMENSIONS)
    ) {
      throw new Error(
        `Mistral embeddings returned ${vectors.length} vector(s) of size ${vectors[0]?.length ?? 0} for ${texts.length} input(s); expected size ${EMBEDDING_DIMENSIONS}.`,
      );
    }
    return vectors;
  }
}
