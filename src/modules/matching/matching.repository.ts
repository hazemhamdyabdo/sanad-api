import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
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

@Injectable()
export class MatchingRepository {
  constructor(
    @InjectRepository(JobMatchProfile) private readonly profileRepo: Repository<JobMatchProfile>,
    @InjectRepository(JobMatchExplanationRow) private readonly explanationRepo: Repository<JobMatchExplanationRow>,
  ) {}

  async findProfile(deviceId: string): Promise<StoredProfileEmbedding | null> {
    const rows: Array<{ profileHash: string; embeddingModel: string; embedding: string }> = await this.profileRepo.query(
      `SELECT "profileHash", "embeddingModel", "embedding"::text AS "embedding" FROM "job_match_profiles" WHERE "deviceId" = $1`,
      [deviceId],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    // pgvector's text form is "[0.1,0.2,...]" — valid JSON.
    return { profileHash: row.profileHash, embeddingModel: row.embeddingModel, embedding: JSON.parse(row.embedding) as number[] };
  }

  /**
   * Stores the device's new CV vector and drops every cached explanation made for a different CV
   * version, atomically — a reader never sees the new vector next to the old CV's scores.
   */
  async replaceProfile(deviceId: string, profile: StoredProfileEmbedding): Promise<void> {
    await this.profileRepo.manager.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO "job_match_profiles" ("deviceId", "profileHash", "embeddingModel", "embedding", "updatedAt")
         VALUES ($1, $2, $3, $4::vector, now())
         ON CONFLICT ("deviceId") DO UPDATE
           SET "profileHash" = EXCLUDED."profileHash", "embeddingModel" = EXCLUDED."embeddingModel",
               "embedding" = EXCLUDED."embedding", "updatedAt" = now()`,
        [deviceId, profile.profileHash, profile.embeddingModel, `[${profile.embedding.join(',')}]`],
      );
      await manager.withRepository(this.explanationRepo).delete({ deviceId, profileHash: Not(profile.profileHash) });
    });
  }

  findExplanations(deviceId: string, profileHash: string, jobIds: string[]): Promise<JobMatchExplanationRow[]> {
    return jobIds.length ? this.explanationRepo.findBy({ deviceId, profileHash, jobId: In(jobIds) }) : Promise.resolve([]);
  }

  async saveExplanations(deviceId: string, profileHash: string, explanations: ExplanationToSave[]): Promise<void> {
    if (!explanations.length) {
      return;
    }
    await this.explanationRepo.upsert(
      explanations.map((explanation) => ({ id: generateId('jme'), deviceId, profileHash, ...explanation })),
      { conflictPaths: ['deviceId', 'jobId'] },
    );
  }
}
