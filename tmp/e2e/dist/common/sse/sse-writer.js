export class SseWriter {
    res;
    heartbeatTimer;
    closed = false;
    constructor(res) {
        this.res = res;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        res.on('close', () => {
            this.closed = true;
            this.stopHeartbeat();
        });
    }
    get isClosed() {
        return this.closed;
    }
    send(event, data) {
        if (this.closed) {
            return;
        }
        this.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
    startHeartbeat(intervalMs = 15000) {
        this.heartbeatTimer = setInterval(() => {
            if (this.closed) {
                return;
            }
            this.res.write(': ping\n\n');
        }, intervalMs);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
    }
    end() {
        this.stopHeartbeat();
        if (!this.closed) {
            this.res.end();
            this.closed = true;
        }
    }
}
//# sourceMappingURL=sse-writer.js.map