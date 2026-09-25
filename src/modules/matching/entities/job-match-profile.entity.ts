import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * The device's CV as a vector — one row per device, replaced whenever the CV (or the upload
 * analysis it's enriched with) changes, which `profileHash` detects. The `embedding vector(1024)`
 * column is deliberately not mapped: `MatchingRepository` writes and reads it with raw SQL, same
 * as the jobs table's embedding.
 */
@Entity('job_match_profiles')
export class JobMatchProfile {
  @PrimaryColumn('uuid')
  deviceId!: string;

  /** Fingerprint of everything the match depends on from the CV side — see `buildCandidateProfile`. */
  @Column('varchar')
  profileHash!: string;

  @Column('varchar')
  embeddingModel!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
