import type { Device } from '../device/index.js';
import type { JobMatchesResponseDto } from './dto/job-matches-response.dto.js';
import { MatchingService } from './matching.service.js';
export declare class MatchingController {
    private readonly matchingService;
    constructor(matchingService: MatchingService);
    getMatches(device: Device): Promise<JobMatchesResponseDto>;
}
