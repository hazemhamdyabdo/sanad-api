import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import type { ApplicationBatchStatus } from '../../../common/types/contract.js';

/**
 * One `POST /applications` request — what the app polls for progress, like an upload. Remembers
 * which applications it processed and which of the requested jobs had already been applied to.
 */
@Entity('application_batches')
export class ApplicationBatch {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('uuid')
  deviceId!: string;

  @Column('varchar')
  status!: ApplicationBatchStatus;

  @Column({ type: 'jsonb' })
  applicationIds!: string[];

  /** Applications for requested jobs that were already sent/prepared/opened before this request — left untouched. */
  @Column({ type: 'jsonb' })
  alreadyAppliedIds!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
