import { AppService, type HealthStatus } from './app.service.js';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    check(): HealthStatus;
}
