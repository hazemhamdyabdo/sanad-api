import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import type { UploadStatus } from '../../../common/types/contract.js';

/**
 * Transient processing bookkeeping only — never the long-lived profile. The uploaded file is kept
 * on disk (`filePath`) just long enough for `CvAnalysisService` to read it, then deleted (success or
 * failure, see `UploadService`) regardless of `expiresAt`. `expiresAt` is a backstop for a job that
 * never finished (e.g. the API restarted mid-analysis) — the scheduled cleanup purges the row and
 * any leftover file once it passes, whatever `status` ended up at. The actual analysis result lives
 * on `CvAnalysis` (see `modules/cv/entities/cv-analysis.entity.ts`), which has no expiry.
 */
@Entity('uploads')
export class Upload {
  @PrimaryColumn('varchar')
  id!: string;

  @Index()
  @Column('uuid')
  deviceId!: string;

  @Column('varchar')
  status!: UploadStatus;

  @Column({ type: 'varchar', nullable: true })
  currentStage!: string | null;

  @Column('varchar')
  filePath!: string;

  @Column('varchar')
  originalFileName!: string;

  @Column('varchar')
  mimeType!: string;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;
}
