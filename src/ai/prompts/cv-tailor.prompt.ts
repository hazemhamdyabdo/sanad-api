import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
import type { TailorCvInput, TailorJobInput } from '../schemas/cv-tailor.schema.js';

/** Must appear in the system message — `FakeLlmProvider`'s `CV_TAILOR_MARKER` routes by this exact phrase. */
export const CV_TAILOR_MARKER = 'Tailor this CV to one job listing';

/** Separates the CV block from the job block in the user message — the fake provider splits on it. */
export const CV_TAILOR_JOB_HEADER = 'JOB LISTING:';

/**
 * Tailoring for one application. Deliberately narrow: the model may only reorder and reword the
 * bullets it's given and reorder the skills. Entries, dates, titles, education and contact details
 * never pass through it at all — they're copied from the real CV in code — and every reworded
 * bullet is fact-checked against its original entry afterwards (see `CvTailorService`).
 */
export function buildCvTailorPrompt(cv: TailorCvInput, job: TailorJobInput): LlmMessage[] {
  const system: LlmMessage = {
    role: 'system',
    content: [
      `${CV_TAILOR_MARKER}. The CV is real and must stay truthful: you may only reorder and reword what is already there.`,
      '- For every experience and project entry, return ALL of its bullets — the same number, no additions, no removals — ordered so the ones most relevant to the listing come first.',
      '- Reword a bullet only to mirror the listing\'s terminology for a fact the bullet already states (e.g. "handled invoices" → "managed invoicing" if the listing says invoicing). Keep it one line, starting with a strong past-tense verb, in English.',
      '- NEVER add a number, percentage, tool, technology, certification, company, client, responsibility or achievement that is not already in that same entry. If the listing asks for something the candidate does not have, do not mention it.',
      '- "skillOrder": the candidate\'s skills, exactly as written, reordered so the ones the listing asks for come first. Do not add or rename skills.',
      '- Keep entries in their original order and refer to them by their "index".',
      'Reply with a JSON object only, exactly this shape:',
      '{"experience": [{"index": number, "bullets": string[]}], "projects": [{"index": number, "bullets": string[]}], "skillOrder": string[]}',
    ].join('\n'),
  };

  const indexed = {
    title: cv.title,
    experience: cv.experience.map((entry, index) => ({ index, ...entry })),
    projects: cv.projects.map((entry, index) => ({ index, ...entry })),
    skills: cv.skills,
  };

  const user: LlmMessage = {
    role: 'user',
    content: ['CV:', JSON.stringify(indexed), '', CV_TAILOR_JOB_HEADER, JSON.stringify(job)].join('\n'),
  };

  return [system, user];
}
