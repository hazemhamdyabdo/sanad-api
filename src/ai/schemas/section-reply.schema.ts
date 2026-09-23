import { z } from 'zod';
import { SECTION_IDS } from '../../common/types/contract.js';

/**
 * What every LLM turn in the section-building conversation must produce.
 * `card`'s inner shape isn't validated per-section yet — that's real
 * prompt/schema design work for later (see TODO.md).
 */
export const sectionReplySchema = z.object({
  message: z.string().min(1),
  section: z.enum(SECTION_IDS),
  sectionDone: z.boolean(),
  card: z.record(z.string(), z.unknown()).nullable(),
});

export type SectionReply = z.infer<typeof sectionReplySchema>;
