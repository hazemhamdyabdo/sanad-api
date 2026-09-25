import type { SttProvider, SttResult } from '../stt.interface.js';
export declare class FakeSttProvider implements SttProvider {
    transcribe(): Promise<SttResult>;
}
