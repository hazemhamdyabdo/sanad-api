import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { RoleGroupId } from '../roles.js';
import type { TargetCountry } from '../countries.js';
import type { ApplyMethod, EmploymentType, WorkType } from '../../../common/types/contract.js';

export type { ApplyMethod };

/**
 * One job posting, sourced from a `JobProvider` and deduplicated by `(provider, externalId)` — the
 * same physical posting is never stored twice even if more than one role's search surfaces it.
 * `role`/`group` record WHICH search first found it (drives matching's exact-vs-adjacent ranking);
 * `country` is the target-country the search was run for, not necessarily what the provider's own
 * `location` says (that's kept separately, informational).
 *
 * The `embedding vector(1024)` column (plus `embeddingModel`/`embeddingTextHash`) is deliberately
 * NOT mapped here: it's only ever written and searched through `JobRepository`'s raw pgvector
 * queries, and hydrating 1024 floats on every ordinary read would be pure waste.
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

  /** Derived in code from the provider's text (see `job-facets.ts`) — a pre-search filter for matching. */
  @Column({ type: 'varchar', nullable: true })
  workType!: WorkType | null;

  @Column({ type: 'varchar', nullable: true })
  employmentType!: EmploymentType | null;

  /** A known city code for `country` (see `cities.ts`), or null when the listing isn't tied to one we recognize — null means "flexible" to the city filter, never excluded. */
  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'jsonb' })
  raw!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  firstSeenAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastSeenAt!: Date;
}
