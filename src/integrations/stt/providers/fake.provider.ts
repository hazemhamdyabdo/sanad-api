import type { SttProvider, SttResult } from '../stt.interface.js';

/** No network calls — returns a fixed Egyptian Arabic line so the voice flow can be exercised without credentials. */
export class FakeSttProvider implements SttProvider {
  transcribe(): Promise<SttResult> {
    return Promise.resolve({ text: 'كنت شغال في محل موبايلات في مدينة نصر سنتين', durationSec: null });
  }
}
