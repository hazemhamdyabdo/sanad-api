import { Column, CreateDateColumn, Entity, Generated, Index, PrimaryColumn } from 'typeorm';
import type { MessageRole, MessageSource, MessageType, SectionId } from '../../../common/types/contract.js';

@Entity('messages')
@Index(['sessionId', 'sequence'])
export class Message {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar')
  sessionId!: string;

  @Column('varchar')
  role!: MessageRole;

  @Column({ type: 'varchar', nullable: true })
  section!: SectionId | null;

  @Column('varchar')
  type!: MessageType;

  @Column({ type: 'text', nullable: true })
  text!: string | null;

  /** An object for most sections, but an array for skills/languages — a user typically names several at once. */
  @Column({ type: 'jsonb', nullable: true })
  card!: Record<string, unknown> | unknown[] | null;

  @Column({ type: 'jsonb', nullable: true })
  quickReplies!: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  source!: MessageSource | null;

  @Column({ type: 'int', nullable: true })
  audioDurationSec!: number | null;

  /** Stable ordering within a session — createdAt alone can collide. */
  @Generated('increment')
  @Column({ type: 'int' })
  sequence!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
