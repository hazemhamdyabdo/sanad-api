import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { CvAnalysisCv } from '../../../ai/schemas/cv-analysis.schema.js';
import type { QualityIssueType, SectionConfidence, SectionId, Seniority } from '../../../common/types/contract.js';

export interface CvAnalysisSkillEntry {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsUsed: number | null;
}

export interface CvAnalysisSkills {
  technical: CvAnalysisSkillEntry[];
  tools: CvAnalysisSkillEntry[];
  soft: CvAnalysisSkillEntry[];
}

export interface CvAnalysisQualityIssue {
  type: QualityIssueType;
  description: string;
}

/**
 * The device's CV-upload analysis — the richer profile "POST /cv/uploads" produces, kept separate
 * from `Cv`/`CvSection` (the confirmed, user-reviewed CV). One row per device, like `Cv`: a new
 * upload replaces the previous analysis. Never expires — unlike `Upload`, this IS the durable data,
 * meant to be read later by job matching/tailoring (not built yet).
 */
@Entity('cv_analyses')
export class CvAnalysis {
  @PrimaryColumn('varchar')
  id!: string;

  @Index({ unique: true })
  @Column('uuid')
  deviceId!: string;

  @Column({ type: 'varchar', nullable: true })
  uploadId!: string | null;

  @Column({ type: 'jsonb' })
  cv!: CvAnalysisCv;

  @Column({ type: 'jsonb' })
  sectionConfidence!: Record<SectionId, SectionConfidence>;

  @Column('varchar')
  seniority!: Seniority;

  @Column({ type: 'real', nullable: true })
  yearsOfExperience!: number | null;

  @Column({ type: 'jsonb' })
  skills!: CvAnalysisSkills;

  @Column({ type: 'jsonb' })
  domains!: string[];

  @Column({ type: 'jsonb' })
  strengths!: string[];

  @Column({ type: 'jsonb' })
  gaps!: string[];

  @Column({ type: 'jsonb' })
  qualityIssues!: CvAnalysisQualityIssue[];

  @Column('int')
  overallScore!: number;

  @Column('text')
  scoreReason!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
