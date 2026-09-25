import { z } from 'zod';
const ARABIC_LETTER = /[؀-ۿ]/;
const arabicLine = () => z.string().trim().min(2).max(120).refine((line) => ARABIC_LETTER.test(line), 'must be Egyptian Arabic');
const lines = () => z.preprocess((value) => Array.isArray(value)
    ? value.flatMap((line) => (typeof line === 'string' ? line.split(/"\s*,\s*"/).map((part) => part.replace(/^[\s"]+|[\s"]+$/g, '')).filter(Boolean) : [line]))
    : value, z.array(arabicLine()));
export const jobMatchEnvelopeSchema = z.object({ matches: z.array(z.unknown()) });
export const jobMatchItemSchema = z.object({
    jobId: z.string().trim().min(1),
    match: z.coerce.number().min(0).max(100).transform((value) => Math.round(value)),
    whyMatch: lines().transform((items) => items.slice(0, 3)),
    gaps: lines().transform((items) => items.slice(0, 3)),
});
//# sourceMappingURL=job-match.schema.js.map