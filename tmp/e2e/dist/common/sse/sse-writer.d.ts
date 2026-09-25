import type { Response } from 'express';
export declare class SseWriter {
    private readonly res;
    private heartbeatTimer?;
    private closed;
    constructor(res: Response);
    get isClosed(): boolean;
    send(event: string, data: unknown): void;
    startHeartbeat(intervalMs?: number): void;
    stopHeartbeat(): void;
    end(): void;
}
