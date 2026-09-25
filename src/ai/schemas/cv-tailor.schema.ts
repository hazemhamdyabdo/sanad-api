import { z } from 'zod';

/** What the tailoring model sees of the CV — only the parts it may touch (bullets, skill order), plus titles for context. */
export interface TailorCvInput {
  title: string | null;
  experience: Array<{ title: string; company: string; bullets: string[] }>;
  projects: Array<{ title: string; description: string; bullets: string[] }>;
  skills: string[];
}

export interface TailorJobInput {
  title: string;
  company: string | null;
  description: string;
}

/**
 * The result, already checked against the original CV: one entry per experience/project, in the
 * CV's own order — the model's reworded bullets where they passed every check, otherwise the
 * original bullets unchanged.
 */
export interface TailoredCvContent {
  experienceBullets: string[][];
  projectBullets: string[][];
  skillOrder: string[];
  /** False when nothing the model produced survived validation — the CV went out as the user wrote it. */
  tailored: boolean;
}

const bullet = () => z.string().trim().min(3).max(400);

export const cvTailorOutputSchema = z.object({
  experience: z.array(z.object({ index: z.coerce.number().int().min(0), bullets: z.array(bullet()) })).default([]),
  projects: z.array(z.object({ index: z.coerce.number().int().min(0), bullets: z.array(bullet()) })).default([]),
  skillOrder: z.array(z.string().trim().min(1)).default([]),
});
