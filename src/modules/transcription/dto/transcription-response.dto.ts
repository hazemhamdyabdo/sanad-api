/** POST /transcriptions — see API-CONTRACT.md §3. */
export interface TranscriptionResponseDto {
  text: string;
  durationSec: number;
}
