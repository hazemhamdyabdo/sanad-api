import type { Application } from './entities/application.entity.js';

const MAX_SEGMENT = 40;
const MAX_STEM = 120;

/**
 * One filesystem-safe ASCII segment: accents folded ("Müller" → "Muller"), anything that isn't a
 * letter or digit becomes a hyphen, runs collapsed, capped. Arabic (and any other script) strips to
 * nothing — some phones mangle non-ASCII filenames — so callers fall back to something else.
 */
export function asciiSegment(text: string | null | undefined): string {
  return (text ?? '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SEGMENT)
    .replace(/-+$/g, '');
}

/**
 * `Name-JobTitle-Company.pdf` for a tailored CV download — the user ends up with one PDF per job on
 * their phone and must be able to tell them apart. Never a bare `cv.pdf`: a missing or non-Latin
 * name falls back to `CV`, a non-Latin job title to the application id's tail (still unique per job),
 * and a missing company is left out.
 */
export function applicationCvFilename(application: Pick<Application, 'id' | 'jobTitle' | 'company' | 'tailoredCv'>): string {
  const name = asciiSegment(application.tailoredCv?.name) || 'CV';
  const job = asciiSegment(application.jobTitle) || `Job-${application.id.slice(-6)}`;
  const company = asciiSegment(application.company);
  const stem = [name, job, company].filter(Boolean).join('-').slice(0, MAX_STEM).replace(/-+$/g, '');
  return `${stem}.pdf`;
}
