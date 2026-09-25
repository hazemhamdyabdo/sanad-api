import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * The LLM's verdict on one job for one device's CV — the per-user match cache. Keyed by
 * `(deviceId, jobId)` and stamped with the CV's `profileHash`: reopening the jobs screen, or
 * changing preferences so an already-explained job shows up again, reuses it with no LLM call. A
 * CV change deletes the device's rows (their hash no longer matches), so nothing stale survives.
 */
@Entity('job_match_explanations')
@Index(['deviceId', 'jobId'], { unique: true })
export class JobMatchExplanationRow {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('uuid')
  deviceId!: string;

  @Column('varchar')
  jobId!: string;

  @Column('varchar')
  profileHash!: string;

  @Column('int')
  match!: number;

  @Column({ type: 'jsonb' })
  whyMatch!: string[];

  @Column({ type: 'jsonb' })
  gaps!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
