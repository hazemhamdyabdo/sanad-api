import type { Response } from 'express';

/** Thin wrapper over the raw response for hand-written SSE endpoints — event framing + a heartbeat so proxies don't time the connection out. */
export class SseWriter {
  private heartbeatTimer?: NodeJS.Timeout;
  private closed = false;

  constructor(private readonly res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.on('close', () => {
      this.closed = true;
      this.stopHeartbeat();
    });
  }

  get isClosed(): boolean {
    return this.closed;
  }

  send(event: string, data: unknown): void {
    if (this.closed) {
      return;
    }
    this.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  startHeartbeat(intervalMs = 15000): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.closed) {
        return;
      }
      this.res.write(': ping\n\n');
    }, intervalMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }

  end(): void {
    this.stopHeartbeat();
    if (!this.closed) {
      this.res.end();
      this.closed = true;
    }
  }
}
