import { Logger } from '@nestjs/common';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
function toMistralMessages(messages) {
    return messages.map((message) => {
        if (!message.documents?.length) {
            return { role: message.role, content: message.content };
        }
        const parts = [{ type: 'text', text: message.content }];
        for (const doc of message.documents) {
            parts.push({ type: 'document_url', document_url: `data:${doc.mimeType};base64,${doc.data.toString('base64')}` });
        }
        return { role: message.role, content: parts };
    });
}
export class MistralProvider {
    apiKey;
    model;
    logger = new Logger(MistralProvider.name);
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }
    async complete(options) {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify({
                model: this.model,
                messages: toMistralMessages(options.messages),
                temperature: options.temperature,
                max_tokens: options.maxTokens,
                stream: false,
                response_format: options.jsonMode ? { type: 'json_object' } : undefined,
            }),
        });
        if (!response.ok) {
            throw await this.toError(response);
        }
        const data = (await response.json());
        if (data.usage) {
            this.logger.log(`usage: prompt=${data.usage.prompt_tokens} completion=${data.usage.completion_tokens} total=${data.usage.total_tokens} model=${this.model}`);
        }
        return data.choices[0]?.message.content ?? '';
    }
    async *stream(options) {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify({
                model: this.model,
                messages: toMistralMessages(options.messages),
                temperature: options.temperature,
                max_tokens: options.maxTokens,
                stream: true,
                response_format: options.jsonMode ? { type: 'json_object' } : undefined,
            }),
        });
        if (!response.ok || !response.body) {
            throw await this.toError(response);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) {
                    continue;
                }
                const payload = trimmed.slice('data:'.length).trim();
                if (payload === '[DONE]') {
                    return;
                }
                const chunk = JSON.parse(payload);
                const text = chunk.choices[0]?.delta.content;
                if (text) {
                    yield text;
                }
            }
        }
    }
    headers() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
    }
    async toError(response) {
        const body = await response.text().catch(() => '');
        return new Error(`Mistral API error ${response.status}: ${body}`);
    }
}
//# sourceMappingURL=mistral.provider.js.map