import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { RoleGroupId } from '../roles.js';
import type { TargetCountry } from '../countries.js';

export type RoleIngestionStatus = 'pending' | 'fresh' | 'failed';

/**
 * The cache/queue entry for one (role GROUP, country) pair — this is what makes "cost scales with
 * groups, not individual role selections or users" true. `ensureRoleIngested` (see `JobsService`)
 * resolves a role to its group and finds-or-creates this row; flipping it to `pending` IS enqueueing
 * it, no separate queue table needed. The background sweep (`JobIngestionService`) picks up `pending`
 * rows, and `fresh` ones become eligible again once `lastFetchedAt` passes `JOB_CACHE_TTL_DAYS`.
 */
@Entity('role_ingestion_cache')
@Index(['group', 'country'], { unique: true })
export class RoleIngestionCache {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar')
  group!: RoleGroupId;

  @Column('varchar')
  country!: TargetCountry;

  @Column('varchar')
  status!: RoleIngestionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastFetchedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
