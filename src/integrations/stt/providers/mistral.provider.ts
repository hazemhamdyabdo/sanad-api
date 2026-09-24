import { Logger } from '@nestjs/common';
import type { SttProvider, SttResult, SttTranscribeOptions } from '../stt.interface.js';

const MISTRAL_TRANSCRIPTIONS_URL = 'https://api.mistral.ai/v1/audio/transcriptions';

/** Mistral caps context biasing at 100 terms. */
const MAX_CONTEXT_BIAS_TERMS = 100;

interface MistralTranscriptionResponse {
  text: string;
  usage?: { prompt_audio_seconds?: number; total_tokens?: number };
}

/**
 * Talks to Mistral's Voxtral transcription endpoint directly over fetch —
 * multipart upload, no SDK needed. `language` and `timestamp_granularities`
 * can't be combined on this endpoint, so timestamps are never requested.
 */
export class MistralSttProvider implements SttProvider {
  private readonly logger = new Logger(MistralSttProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async transcribe(options: SttTranscribeOptions): Promise<SttResult> {
    const form = new FormData();
    form.append('model', this.model);
    form.append('file', new Blob([new Uint8Array(options.audio)], { type: options.mimeType }), options.filename);
    if (options.language) {
      form.append('language', options.language);
    }
    // Multi-word terms use underscores instead of spaces, per Mistral's context-biasing format.
    for (const term of (options.contextBias ?? []).slice(0, MAX_CONTEXT_BIAS_TERMS)) {
      // Multipart arrays are represented as repeated fields by Mistral's API.
      form.append('context_bias', term.trim().replace(/\s+/g, '_'));
    }

    const response = await fetch(MISTRAL_TRANSCRIPTIONS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Mistral transcription error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as MistralTranscriptionResponse;
    const durationSec = data.usage?.prompt_audio_seconds ?? null;
    this.logger.log(`usage: audio_seconds=${durationSec ?? '?'} total_tokens=${data.usage?.total_tokens ?? '?'} model=${this.model}`);
    return { text: data.text ?? '', durationSec };
  }
}
