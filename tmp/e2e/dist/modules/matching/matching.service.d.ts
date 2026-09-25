import { JobMatchService } from '../../ai/index.js';
import { type EmbeddingProvider } from '../../integrations/embeddings/embedding.interface.js';
import { ApplicationsService } from '../applications/index.js';
import { CvService } from '../cv/index.js';
import type { Device } from '../device/index.js';
import { JobsService } from '../jobs/index.js';
import { PreferencesService } from '../preferences/index.js';
import type { JobMatchesResponseDto } from './dto/job-matches-response.dto.js';
import { MatchingRepository } from './matching.repository.js';
export declare class MatchingService {
    private readonly cvService;
    private readonly jobsService;
    private readonly preferencesService;
    private readonly matchingRepository;
    private readonly jobMatchService;
    private readonly applicationsService;
    private readonly embeddings;
    private readonly logger;
    private readonly inFlight;
    constructor(cvService: CvService, jobsService: JobsService, preferencesService: PreferencesService, matchingRepository: MatchingRepository, jobMatchService: JobMatchService, applicationsService: ApplicationsService, embeddings: EmbeddingProvider);
    getMatches(device: Device): Promise<JobMatchesResponseDto>;
    private computeMatches;
    private loadCandidate;
    private requestIngestion;
    private ensureProfile;
    private explain;
}
