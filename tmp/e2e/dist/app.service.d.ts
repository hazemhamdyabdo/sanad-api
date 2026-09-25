export interface HealthStatus {
    status: 'ok';
    uptimeSec: number;
}
export declare class AppService {
    getHealth(): HealthStatus;
}
