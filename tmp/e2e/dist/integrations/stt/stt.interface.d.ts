export interface SttTranscribeOptions {
    audio: Buffer;
    mimeType: string;
    filename: string;
    language?: string;
    contextBias?: string[];
}
export interface SttResult {
    text: string;
    durationSec: number | null;
}
export interface SttProvider {
    transcribe(options: SttTranscribeOptions): Promise<SttResult>;
}
export declare const STT_PROVIDER: unique symbol;
