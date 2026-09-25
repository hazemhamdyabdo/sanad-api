/**
 * The port every business module depends on for storing an uploaded file. Same rule as
 * LlmProvider/SttProvider: no filesystem/SDK call outside integrations/ — swapping the local
 * provider for an S3-compatible one later is a one-file change in providers/ + storage.module.ts.
 */
export interface StorageProvider {
  /** Saves the buffer under a name derived from `filename`, returns the opaque path to pass back to `read`/`delete`. */
  save(buffer: Buffer, filename: string): Promise<string>;
  read(path: string): Promise<Buffer>;
  /** Best-effort — a missing file is not an error, there's nothing left to clean up either way. */
  delete(path: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
