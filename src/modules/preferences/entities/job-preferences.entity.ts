import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { WorkType } from '../../../common/types/contract.js';

/** One row per device — what job matching filters on before its vector search. Replaced wholesale by `PUT /preferences`. */
@Entity('job_preferences')
export class JobPreferences {
  @PrimaryColumn('uuid')
  deviceId!: string;

  /** ISO 3166 alpha-2 code, or `worldwide` (see `WORLDWIDE`). */
  @Column('varchar')
  country!: string;

  /** A city code (see `modules/jobs/cities.ts`), or null for anywhere in the country. Always null for `worldwide`. */
  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'jsonb' })
  workTypes!: WorkType[];

  /** Informational for now — stored so it survives, not used as a filter (same as the app). */
  @Column({ type: 'boolean', default: false })
  willingToRelocate!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
