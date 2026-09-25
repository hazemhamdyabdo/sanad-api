import type { Response } from 'express';
import type { Device } from '../device/index.js';
import { CvService } from './cv.service.js';
import type { CvResponseDto } from './dto/cv-response.dto.js';
import { PatchCvDto } from './dto/patch-cv.dto.js';
export declare class CvController {
    private readonly cvService;
    constructor(cvService: CvService);
    getCv(device: Device): Promise<CvResponseDto>;
    patchCv(device: Device, dto: PatchCvDto): Promise<CvResponseDto>;
    exportPdf(device: Device, response: Response): Promise<void>;
}
