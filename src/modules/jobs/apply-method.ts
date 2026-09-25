import type { ApplyMethod } from './entities/job.entity.js';

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Business logic, not provider-specific — deliberately lives here rather than in
 * `integrations/jobs/`, so a second provider gets the same rule for free. Jooble (and most
 * aggregators) has no structured "apply by email" field, so this is a deterministic scan of the
 * snippet text for an email address; anything else defaults to `external` (the listing link).
 *
 * Known limitation: a snippet is often a short teaser, so a real email-apply job whose address only
 * appears on the full external listing will be missed here — it correctly falls back to `external`
 * rather than ever guessing wrong the other way (never reports `email` without an address actually
 * found in hand).
 */
export function resolveApplyMethod(snippet: string | null): { method: ApplyMethod; email: string | null } {
  const match = snippet?.match(EMAIL_PATTERN);
  if (match) {
    return { method: 'email', email: match[0] };
  }
  return { method: 'external', email: null };
}
