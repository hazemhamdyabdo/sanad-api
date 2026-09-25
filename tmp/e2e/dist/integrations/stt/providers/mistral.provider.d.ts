import type { SttProvider, SttResult, SttTranscribeOptions } from '../stt.interface.js';
export declare class MistralSttProvider implements SttProvider {
    private readonly apiKey;
    private readonly model;
    private readonly logger;
    constructor(apiKey: string, model: string);
    transcribe(options: SttTranscribeOptions): Promise<SttResult>;
}
