/**
 * Bounded waiting for anything that talks to the outside world. Nothing in this app may wait
 * forever: a hung LLM, embeddings, job-board or email call would otherwise leave a background job
 * (CV analysis, matching, an application batch) "in progress" with no way for the app to tell slow
 * from dead. Every outbound `fetch` goes through `fetchWithTimeout`, and whole background steps
 * are capped with `withTimeout`.
 */
export class TimeoutError extends Error {
  constructor(what: string, ms: number) {
    super(`${what} timed out after ${Math.round(ms / 1000)}s`);
    this.name = 'TimeoutError';
  }
}

/** True for our own `TimeoutError` and for the `TimeoutError`/`AbortError` DOMExceptions `fetch` rejects with when its signal fires. */
export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof TimeoutError ||
    (error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError'))
  );
}

/** Rejects with a `TimeoutError` if `promise` hasn't settled within `ms`. The underlying work is not cancelled — the caller decides what a late result means. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  what: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(what, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() =>
    clearTimeout(timer),
  ) as Promise<T>;
}

/**
 * `fetch` that gives up — request, headers and body read together — after `ms`, rejecting with a
 * `TimeoutError` that names the call (`what`) so a log line says which provider hung. A caller
 * that streams the body must not use this (the body would be cut off mid-way); see the LLM
 * provider's own idle timeout for that case.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
  what: string,
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new TimeoutError(what, ms);
    }
    throw error;
  }
}
