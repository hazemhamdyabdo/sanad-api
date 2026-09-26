/**
 * Enums shared across modules, mirroring API-CONTRACT.md's "ثوابت" section
 * plus the per-endpoint status enums it implies. Keep in sync with the
 * contract — never change a value here without updating it there too.
 */

export const SECTION_IDS = [
  'basic',
  'experience',
  'projects',
  'education',
  'certificates',
  'skills',
  'languages',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert', 'native'] as const;
export type Level = (typeof LEVELS)[number];

export const MESSAGE_TYPES = ['text', 'section_card', 'cv_ready_card'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_ROLES = ['ai', 'user'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const MESSAGE_SOURCES = ['text', 'voice'] as const;
export type MessageSource = (typeof MESSAGE_SOURCES)[number];

export const SESSION_MODES = ['build', 'upload'] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

export const SESSION_STATUSES = ['in_progress', 'completed'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SECTION_STATUSES = ['pending', 'in_progress', 'confirmed'] as const;
export type SectionStatus = (typeof SECTION_STATUSES)[number];

export const UPLOAD_STATUSES = ['parsing', 'done', 'failed'] as const;
export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

export const SENIORITY_LEVELS = ['junior', 'mid', 'senior'] as const;
export type Seniority = (typeof SENIORITY_LEVELS)[number];

/**
 * How sure the CV-upload analysis is about one section, decided deterministically in code (the
 * same validation the live conversation already uses to decide a section's card is complete) —
 * never a self-reported score from the model. `high` sections are saved into the CV automatically;
 * `low` ones are left for the user to fill in via the upload-mode conversation; `n/a` means the
 * section legitimately doesn't apply (e.g. `experience` when the CV is all `projects`).
 */
export const SECTION_CONFIDENCE_LEVELS = ['high', 'low', 'n/a'] as const;
export type SectionConfidence = (typeof SECTION_CONFIDENCE_LEVELS)[number];

export const QUALITY_ISSUE_TYPES = [
  'employment_gap',
  'weak_bullets',
  'no_metrics',
  'ats_formatting',
  'inconsistent_dates',
  'contact_missing',
  'generic_summary',
  'other',
] as const;
export type QualityIssueType = (typeof QUALITY_ISSUE_TYPES)[number];

/** Arabic labels for each section — the contract shows these as examples, not a fixed enum, so wording here isn't a contract commitment. */
export const SECTION_LABELS: Record<SectionId, string> = {
  basic: 'البيانات الأساسية',
  experience: 'الخبرات',
  projects: 'المشاريع',
  education: 'التعليم',
  certificates: 'الشهادات',
  skills: 'المهارات',
  languages: 'اللغات',
};

/**
 * A brand-new "build" session starts with this order. `experience` vs
 * `projects` is meant to be decided by the AI once it learns whether the
 * user has worked before (see API-CONTRACT.md) — that decision doesn't
 * exist yet, so this defaults to `experience`.
 */
export const DEFAULT_BUILD_SECTIONS: SectionId[] = ['basic', 'experience', 'education', 'certificates', 'skills', 'languages'];

/** The fixed action pair shown on every section_card, per the contract's example. */
export const SECTION_CARD_ACTIONS = ['تأكيد', 'تعديل'] as const;

/** Job matching (API-CONTRACT.md §6). `workType` is also a job-preferences filter. */
export const WORK_TYPES = ['on_site', 'hybrid', 'remote'] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'shifts', 'field'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/**
 * How a matched job relates to the role resolved from the CV's title: the same curated role
 * (`exact`), another role in the same adjacency group (`adjacent`), or no role could be resolved
 * from the CV so the match rests on the vector search alone (`related`). Ranking puts `exact`
 * before `adjacent` before `related`.
 */
export const ROLE_MATCHES = ['exact', 'adjacent', 'related'] as const;
export type RoleMatch = (typeof ROLE_MATCHES)[number];

export const APPLY_METHODS = ['email', 'external'] as const;
export type ApplyMethod = (typeof APPLY_METHODS)[number];

/** `searching`: the jobs for the CV's role in this country are still being fetched — the list may be partial, ask again shortly. */
export const MATCHES_STATUSES = ['ready', 'searching'] as const;
export type MatchesStatus = (typeof MATCHES_STATUSES)[number];

/** A job-preferences country is an ISO 3166 alpha-2 code, or this for "anywhere" (remote). */
export const WORLDWIDE = 'worldwide';

/**
 * Applications (API-CONTRACT.md §7). `sent`: we emailed the company. `prepared`: tailored CV ready,
 * the user must finish on the listing site — never counted as applied. `opened`: the user opened
 * that listing. `submitted`: the user told us they finished applying on that site — counted as
 * applied, like `sent`. `processing`: still tailoring/sending. `failed`: see the application's error.
 */
export const APPLICATION_STATUSES = ['processing', 'sent', 'prepared', 'opened', 'submitted', 'failed'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Where a `processing` application is right now — for real progress in the app. */
export const APPLICATION_STAGES = ['tailoring', 'sending'] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const APPLICATION_BATCH_STATUSES = ['processing', 'done'] as const;
export type ApplicationBatchStatus = (typeof APPLICATION_BATCH_STATUSES)[number];
