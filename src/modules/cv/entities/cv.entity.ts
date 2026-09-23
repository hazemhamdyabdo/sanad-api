import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { SectionId } from '../../../common/types/contract.js';

export interface CvContact {
  phone?: string;
  email?: string;
  location?: string;
}

/**
 * Belongs to a device only — the conversation session points at the cv
 * (ConversationSession.cvId), not the other way round. One active CV per
 * device in phase 1, enforced by a unique index on deviceId.
 */
@Entity('cvs')
export class Cv {
  @PrimaryColumn('varchar')
  id!: string;

  @Index({ unique: true })
  @Column('uuid')
  deviceId!: string;

  @Column({ type: 'boolean', default: false })
  isComplete!: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  confirmedSections!: SectionId[];

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  contact!: CvContact | null;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
