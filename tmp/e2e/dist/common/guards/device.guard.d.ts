import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { DeviceService, type Device } from '../../modules/device/index.js';
export declare const DEVICE_ID_HEADER = "x-device-id";
export interface RequestWithDevice extends Request {
    deviceId: string;
    device?: Device;
}
export declare class DeviceGuard implements CanActivate {
    private readonly reflector;
    private readonly deviceService;
    constructor(reflector: Reflector, deviceService: DeviceService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
