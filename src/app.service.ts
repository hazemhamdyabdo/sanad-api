import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  uptimeSec: number;
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return { status: 'ok', uptimeSec: Math.round(process.uptime()) };
  }
}
