import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import type { CvAnalysisResult } from '../../ai/index.js';
import type { SectionId } from '../../common/types/contract.js';
import { CvRepository } from './cv.repository.js';
import { type CvAnalysisResponseDto } from './dto/cv-analysis-response.dto.js';
import { type CvResponseDto } from './dto/cv-response.dto.js';
import type { PatchCvDto } from './dto/patch-cv.dto.js';
import { CvPdfRenderer } from '../../integrations/pdf/cv-pdf.renderer.js';
export interface ConfirmSectionResult {
    cvId: string;
    isComplete: boolean;
}
export declare class CvService {
    private readonly cvRepository;
    private readonly cvPdfRenderer;
    private readonly dataSource;
    constructor(cvRepository: CvRepository, cvPdfRenderer: CvPdfRenderer, dataSource: DataSource);
    exportPdf(deviceId: string): Promise<{
        file: Buffer;
        filename: string;
    }>;
    renderPdf(cv: CvResponseDto): {
        file: Buffer;
        filename: string;
    };
    existsForDevice(deviceId: string): Promise<boolean>;
    deleteById(id: string, manager?: EntityManager): Promise<void>;
    confirmSection(deviceId: string, existingCvId: string | null, section: SectionId, content: Record<string, unknown> | unknown[], isLast: boolean, manager: EntityManager): Promise<ConfirmSectionResult>;
    saveAnalysis(deviceId: string, uploadId: string, analysis: CvAnalysisResult): Promise<void>;
    getAnalysisForDevice(deviceId: string): Promise<CvAnalysisResponseDto | null>;
    getAnalysisForUpload(uploadId: string, deviceId: string): Promise<CvAnalysisResponseDto | null>;
    getForDevice(deviceId: string): Promise<CvResponseDto>;
    patch(deviceId: string, dto: PatchCvDto): Promise<CvResponseDto>;
}
