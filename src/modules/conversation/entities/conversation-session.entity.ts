import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { SectionId, SectionStatus, SessionMode, SessionStatus } from '../../../common/types/contract.js';

export interface SessionSection {
  id: SectionId;
  label: string;
  status: SectionStatus;
}

/**
 * FK columns are plain, not TypeORM relations — a module's repository only
 * touches its own entities (see AGENTS.md), so cross-module lookups (e.g.
 * device, cv, upload) go through those modules' own repositories instead of
 * an eager/joined relation here.
 */
@Entity('conversation_sessions')
export class ConversationSession {
  @PrimaryColumn('varchar')
  id!: string;

  @Index()
  @Column('uuid')
  deviceId!: string;

  @Column('varchar')
  mode!: SessionMode;

  @Column('varchar')
  status!: SessionStatus;

  @Column({ type: 'varchar', nullable: true })
  currentSection!: SectionId | null;

  @Column({ type: 'jsonb' })
  sections!: SessionSection[];

  @Column({ type: 'varchar', nullable: true })
  uploadId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  cvId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
