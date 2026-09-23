import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import type { SectionId, UploadStatus } from '../../../common/types/contract.js';

export interface UploadSummary {
  found: Array<{ section: SectionId; label: string; count: number }>;
  missingSections: SectionId[];
  missingFields: string[];
}

/**
 * expiresAt is set by the upload service at creation time (not a DB
 * default) — the retention window is a product decision, not schema.
 * A cleanup job to purge expired files + rows is tracked in TODO.md.
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

  @Column({ type: 'jsonb', nullable: true })
  summary!: UploadSummary | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;
}
