import { Controller, Get } from '@nestjs/common';
import { CurrentDevice } from '../../common/decorators/current-device.decorator.js';
import type { Device } from '../device/index.js';
import type { JobMatchesResponseDto } from './dto/job-matches-response.dto.js';
import { MatchingService } from './matching.service.js';

@Controller('jobs')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('matches')
  getMatches(@CurrentDevice() device: Device): Promise<JobMatchesResponseDto> {
    return this.matchingService.getMatches(device);
  }
}
