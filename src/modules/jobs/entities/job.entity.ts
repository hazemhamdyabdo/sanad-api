import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { RoleGroupId } from '../roles.js';
import type { TargetCountry } from '../countries.js';

export type ApplyMethod = 'email' | 'external';

/**
 * One job posting, sourced from a `JobProvider` and deduplicated by `(provider, externalId)` — the
 * same physical posting is never stored twice even if more than one role's search surfaces it.
 * `role`/`group` record WHICH search first found it (for later exact-vs-adjacent ranking, not yet
 * built); `country` is the target-country the search was run for, not necessarily what the
 * provider's own `location` says (that's kept separately, informational).
 */
@Entity('jobs')
@Index(['provider', 'externalId'], { unique: true })
export class Job {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar')
  provider!: string;

  @Column('varchar')
  externalId!: string;

  @Column('varchar')
  role!: string;

  @Column('varchar')
  group!: RoleGroupId;

  @Column('varchar')
  country!: TargetCountry;

  @Column('varchar')
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  company!: string | null;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  snippet!: string | null;

  @Column({ type: 'varchar', nullable: true })
  salary!: string | null;

  @Column({ type: 'varchar', nullable: true })
  jobType!: string | null;

  @Column('varchar')
  link!: string;

  @Column('varchar')
  applyMethod!: ApplyMethod;

  @Column({ type: 'varchar', nullable: true })
  applyEmail!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sourceUpdatedAt!: Date | null;

  @Column({ type: 'jsonb' })
  raw!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  firstSeenAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastSeenAt!: Date;
}
