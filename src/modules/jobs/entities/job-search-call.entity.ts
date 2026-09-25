import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * A permanent record of every outbound call to a job provider, real or attempted — the direct
 * answer to "how many have we used" (`SELECT COUNT(*) FROM job_search_calls WHERE provider =
 * 'jooble'`), and the source of truth `JobIngestionService` checks before making another one. Never
 * deleted, never truncated — this table IS the budget.
 */
@Entity('job_search_calls')
export class JobSearchCall {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar')
  provider!: string;

  @Column('varchar')
  keywords!: string;

  @Column('varchar')
  location!: string;

  @Column('int')
  page!: number;

  @Column('boolean')
  succeeded!: boolean;

  @Column({ type: 'int', nullable: true })
  jobsReturned!: number | null;

  @Column({ type: 'int', nullable: true })
  totalCount!: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  requestedAt!: Date;
}
