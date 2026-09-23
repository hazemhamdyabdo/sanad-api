import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { SectionId } from '../../../common/types/contract.js';

/**
 * One row per confirmed section. `content` shape depends on `section`
 * (an array for experience/education/certificates/skills/languages, an
 * object for basic) — validated by the cv module's DTOs, not here.
 */
@Entity('cv_sections')
@Index(['cvId', 'section'], { unique: true })
export class CvSection {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar')
  cvId!: string;

  @Column('varchar')
  section!: SectionId;

  @Column({ type: 'jsonb' })
  content!: unknown;

  @Column({ type: 'timestamptz' })
  confirmedAt!: Date;
}
