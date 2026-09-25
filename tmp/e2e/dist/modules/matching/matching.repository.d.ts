import { Repository } from 'typeorm';
import { JobMatchExplanationRow } from './entities/job-match-explanation.entity.js';
import { JobMatchProfile } from './entities/job-match-profile.entity.js';
export interface StoredProfileEmbedding {
    profileHash: string;
    embeddingModel: string;
    embedding: number[];
}
export interface ExplanationToSave {
    jobId: string;
    match: number;
    whyMatch: string[];
    gaps: string[];
}
export declare class MatchingRepository {
    private readonly profileRepo;
    private readonly explanationRepo;
    constructor(profileRepo: Repository<JobMatchProfile>, explanationRepo: Repository<JobMatchExplanationRow>);
    findProfile(deviceId: string): Promise<StoredProfileEmbedding | null>;
    replaceProfile(deviceId: string, profile: StoredProfileEmbedding): Promise<void>;
    findExplanations(deviceId: string, profileHash: string, jobIds: string[]): Promise<JobMatchExplanationRow[]>;
    saveExplanations(deviceId: string, profileHash: string, explanations: ExplanationToSave[]): Promise<void>;
}
