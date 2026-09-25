import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { ApplicationStage, ApplicationStatus, ApplyMethod } from '../../../common/types/contract.js';
import type { CvResponseDto } from '../../cv/index.js';

/** Internal failure reasons — mapped to Egyptian Arabic in the response DTO, never shown raw. */
export type ApplicationErrorCode = 'no_candidate_email' | 'send_failed' | 'job_unavailable' | 'internal';

/**
 * One device's application to one job — at most one row per `(deviceId, jobId)`, which is what makes
 * "never apply to the same job twice" a database guarantee, not just a check. A `failed` row is the
 * only kind that can be picked up again by a new request. The job's display fields are snapshotted
 * so the applications list stays readable even if the listing changes or disappears.
 */
@Entity('applications')
@Index(['deviceId', 'jobId'], { unique: true })
export class Application {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('uuid')
  deviceId!: string;

  /** Null only if the job row was later deleted — the snapshot below still describes it. */
  @Column({ type: 'varchar', nullable: true })
  jobId!: string | null;

  /** The request that last processed this application. */
  @Column('varchar')
  batchId!: string;

  @Column('varchar')
  method!: ApplyMethod;

  @Column('varchar')
  status!: ApplicationStatus;

  @Column({ type: 'varchar', nullable: true })
  stage!: ApplicationStage | null;

  @Column('varchar')
  jobTitle!: string;

  @Column({ type: 'varchar', nullable: true })
  company!: string | null;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column('varchar')
  listingUrl!: string;

  /** The company address the email goes to — `email` method only. */
  @Column({ type: 'varchar', nullable: true })
  recipientEmail!: string | null;

  /** Exactly the CV that was sent / prepared, in `GET /cv`'s shape. Null until tailoring finishes. */
  @Column({ type: 'jsonb', nullable: true })
  tailoredCv!: CvResponseDto | null;

  /** False when tailoring produced no usable change and the CV went out as the user wrote it. */
  @Column({ type: 'boolean', default: false })
  cvTailored!: boolean;

  @Column({ type: 'varchar', nullable: true })
  errorCode!: ApplicationErrorCode | null;

  /** Technical detail for debugging a failure (e.g. the provider's error) — never sent to the app. */
  @Column({ type: 'text', nullable: true })
  errorDetail!: string | null;

  @Column({ type: 'varchar', nullable: true })
  providerMessageId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  preparedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  openedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt!: Date | null;
}
