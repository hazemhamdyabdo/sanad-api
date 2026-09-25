import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * A CV title that didn't match any curated role (see `resolveRoleFromCvTitle`) — kept so real usage
 * can show which roles are missing from the fixed list and should be added, per the "log it, don't
 * guess" rule. Keyed on the normalized title so a repeated miss increments `count` instead of
 * growing the table unbounded.
 */
@Entity('unmatched_role_titles')
export class UnmatchedRoleTitle {
  @PrimaryColumn('varchar')
  id!: string;

  @Index({ unique: true })
  @Column('varchar')
  normalizedTitle!: string;

  /** The most recent raw title seen for this normalized form, for readability when reviewing the log. */
  @Column('varchar')
  exampleTitle!: string;

  @Column('int')
  count!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  firstSeenAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastSeenAt!: Date;
}
