import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
import { Job } from './entities/job.entity.js';

@Injectable()
export class JobRepository {
  constructor(@InjectRepository(Job) private readonly jobRepo: Repository<Job>) {}

  /**
   * Insert-or-refresh by `(provider, externalId)` — the same posting seen again just bumps
   * `lastSeenAt` and refreshes mutable fields (salary, snippet, ...) rather than duplicating. `id` is
   * never taken from the caller: an existing row keeps its own id (overwriting it here would try to
   * re-insert under a new primary key and collide with the `(provider, externalId)` unique index).
   */
  async upsert(job: Omit<Job, 'id' | 'firstSeenAt' | 'lastSeenAt'>): Promise<void> {
    const existing = await this.jobRepo.findOneBy({ provider: job.provider, externalId: job.externalId });
    if (existing) {
      await this.jobRepo.save(Object.assign(existing, job));
    } else {
      await this.jobRepo.save({ id: generateId('job'), ...job });
    }
  }
}
