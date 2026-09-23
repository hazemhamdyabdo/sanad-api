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
