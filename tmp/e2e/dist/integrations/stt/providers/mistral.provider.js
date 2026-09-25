import { Logger } from '@nestjs/common';
const MISTRAL_TRANSCRIPTIONS_URL = 'https://api.mistral.ai/v1/audio/transcriptions';
const MAX_CONTEXT_BIAS_TERMS = 100;
export class MistralSttProvider {
    apiKey;
    model;
    logger = new Logger(MistralSttProvider.name);
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }
    async transcribe(options) {
        const form = new FormData();
        form.append('model', this.model);
        form.append('file', new Blob([new Uint8Array(options.audio)], { type: options.mimeType }), options.filename);
        if (options.language) {
            form.append('language', options.language);
        }
        for (const term of (options.contextBias ?? []).slice(0, MAX_CONTEXT_BIAS_TERMS)) {
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
        const data = (await response.json());
        const durationSec = data.usage?.prompt_audio_seconds ?? null;
        this.logger.log(`usage: audio_seconds=${durationSec ?? '?'} total_tokens=${data.usage?.total_tokens ?? '?'} model=${this.model}`);
        return { text: data.text ?? '', durationSec };
    }
}
//# sourceMappingURL=mistral.provider.js.map