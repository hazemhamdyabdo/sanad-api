export interface SttTranscribeOptions {
  audio: Buffer;
  mimeType: string;
  filename: string;
  /** ISO 639-1 code, e.g. "ar". Providers that can't use it just ignore it. */
  language?: string;
  /** Words/phrases the audio likely contains (names, companies, skills) — a hint only, providers may ignore it. */
  contextBias?: string[];
}

export interface SttResult {
  text: string;
  /** Audio length as measured by the provider, or null when it doesn't report one. */
  durationSec: number | null;
}

/**
 * The port every business module depends on for speech-to-text. Same rule as
 * LlmProvider: no vendor SDK, HTTP client, or raw provider response outside
 * integrations/ — swapping providers is a one-file change in providers/ + stt.module.ts.
 */
export interface SttProvider {
  transcribe(options: SttTranscribeOptions): Promise<SttResult>;
}

export const STT_PROVIDER = Symbol('STT_PROVIDER');
