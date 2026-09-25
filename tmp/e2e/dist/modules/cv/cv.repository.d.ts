import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import type { SectionId } from '../../common/types/contract.js';
import { Cv } from './entities/cv.entity.js';
import { CvAnalysis } from './entities/cv-analysis.entity.js';
import { CvSection } from './entities/cv-section.entity.js';
export declare class CvRepository {
    private readonly cvRepo;
    private readonly cvSectionRepo;
    private readonly cvAnalysisRepo;
    constructor(cvRepo: Repository<Cv>, cvSectionRepo: Repository<CvSection>, cvAnalysisRepo: Repository<CvAnalysis>);
    existsForDevice(deviceId: string): Promise<boolean>;
    findByDeviceId(deviceId: string, manager?: EntityManager): Promise<Cv | null>;
    deleteById(id: string, manager?: EntityManager): Promise<void>;
    findById(id: string, manager?: EntityManager): Promise<Cv | null>;
    createCv(cv: Omit<Cv, 'createdAt' | 'updatedAt'>, manager?: EntityManager): Promise<Cv>;
    saveCv(cv: Cv, manager?: EntityManager): Promise<Cv>;
    createSection(section: CvSection, manager?: EntityManager): Promise<CvSection>;
    deleteSectionsByCvId(cvId: string, manager?: EntityManager): Promise<void>;
    findSectionsByCvId(cvId: string): Promise<CvSection[]>;
    upsertSection(cvId: string, section: SectionId, content: unknown, manager?: EntityManager): Promise<void>;
    findAnalysisByDeviceId(deviceId: string): Promise<CvAnalysis | null>;
    findAnalysisByUploadId(uploadId: string, deviceId: string): Promise<CvAnalysis | null>;
    upsertAnalysis(analysis: Omit<CvAnalysis, 'createdAt' | 'updatedAt'>, manager?: EntityManager): Promise<CvAnalysis>;
    private scoped;
}
