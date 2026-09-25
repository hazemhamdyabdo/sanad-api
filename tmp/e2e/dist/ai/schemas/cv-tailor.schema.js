import { z } from 'zod';
const bullet = () => z.string().trim().min(3).max(400);
export const cvTailorOutputSchema = z.object({
    experience: z.array(z.object({ index: z.coerce.number().int().min(0), bullets: z.array(bullet()) })).default([]),
    projects: z.array(z.object({ index: z.coerce.number().int().min(0), bullets: z.array(bullet()) })).default([]),
    skillOrder: z.array(z.string().trim().min(1)).default([]),
});
//# sourceMappingURL=cv-tailor.schema.js.map