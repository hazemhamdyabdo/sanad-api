import type { LlmMessage } from '../../integrations/llm/llm.interface.js';
import type { MatchCandidate, MatchJob } from '../schemas/job-match.schema.js';

/** Must appear in the system message — `FakeLlmProvider`'s `JOB_MATCH_MARKER` routes to a canned reply by this exact phrase. */
export const JOB_MATCH_MARKER = 'قيّم مدى مناسبة الوظايف';

/** Separates the candidate block from the jobs block in the user message — the fake provider splits on it too. */
export const JOB_MATCH_JOBS_HEADER = 'الوظايف:';

/**
 * Bump when the prompt's rules or the output's validation/cleanup change — it's part of every
 * cached explanation's fingerprint (see `modules/matching`), so cached scores from an older version
 * get recomputed instead of mixed in.
 */
export const JOB_MATCH_PROMPT_VERSION = 'v10';

/**
 * Stage two of matching: the vector search already picked these jobs as the closest to the CV;
 * this explains each one — a score, why it fits, and what's missing — in the same short Egyptian
 * Arabic lines the app's job cards show ("خبرة Excel متقدمة"). Grounded-only, like every other
 * prompt here: nothing about the candidate or the job that isn't in the given data.
 */
export function buildJobMatchPrompt(candidate: MatchCandidate, jobs: MatchJob[]): LlmMessage[] {
  const system: LlmMessage = {
    role: 'system',
    content: [
      `${JOB_MATCH_MARKER} دي لمرشح واحد. كل وظيفة تتقيّم لوحدها، بناءً على بيانات المرشح ووصف الوظيفة اللي قدامك بس.`,
      '- "match": رقم صحيح من 0 لـ 100 بيقول الوظيفة مناسبة له قد إيه:',
      '  85-100: نفس الدور تقريبًا والمهارات والأقدمية مناسبين. 70-84: مناسبة مع نواقص بسيطة. 50-69: مناسبة جزئيًا (دور قريب أو أقدمية مختلفة). أقل من 50: مش مناسبة غالبًا.',
      '- "whyMatch": من 0 لـ 3 أسباب بالمصري (لو الوظيفة مش مناسبة خالص رجّع [])، كل سبب جملة قصيرة (من 3 لـ 8 كلمات) عن حاجة موجودة فعلًا في بيانات المرشح اللي قدامك وبتقابل حاجة في الوظيفة. كل سبب لازم يذكر اسم المهارة أو الأداة أو الشهادة أو المسمى أو الشركة بالإنجليزي بالظبط زي ما هو مكتوب في بيانات المرشح، والأرقام بالأرقام (مثلًا "4 سنين خبرة" مش "أربع سنين"). أمثلة للأسلوب: "خبرة Excel متقدمة"، "بكالوريوس Commerce – Accounting"، "2 سنين خبرة Customer Service".',
      '- "whyMatch" بيتكلم عن المرشح بس: ممنوع تكتب فيه أي مهارة أو أداة أو خبرة مذكورة في الوظيفة ومش موجودة في بيانات المرشح — حتى لو قريبة من خبرته. اللي الوظيفة طالباه ومش عنده مكانه "gaps". أي سبب فيه حاجة مش في بيانات المرشح بيتشال أوتوماتيك.',
      '- "gaps": من 0 لـ 3 نواقص بالمصري بنفس الأسلوب القصير — بس حاجة مطلوبة صراحةً في وصف الوظيفة أو في المسمى الوظيفي (زي أقدمية أعلى) ومش موجودة عند المرشح. أمثلة: "مطلوب معرفة بسيستم ERP"، "مطلوب خبرة 5 سنين". لو مفيش نواقص واضحة رجّع [].',
      '- "highlights" عند المرشح هي مهامه وإنجازاته الفعلية — اعتبرها دليل على مهارة حتى لو مش مكتوبة في "skills" (مثلًا "Prepared supplier invoices" معناها عنده خبرة invoicing)، فمتكتبهاش نقص.',
      '- خبرة أكتر من المطلوب مش نقص: مرشح عنده 3 سنين على وظيفة طالبة "0-2 سنة" مناسب، متكتبهاش في "gaps" ومتنزلش الـ "match" عشانها. ومرشح mid أو senior على وظيفة junior ممكن الـ "match" تنزل شوية، بس ده مش نقص يتكتب في "gaps".',
      '- متخترعش متطلبات مش مكتوبة في الوصف، ومتخترعش خبرات أو مهارات مش عند المرشح. لو الوصف قصير ومفيهوش تفاصيل، قيّم على المسمى والمجال والأقدمية بس.',
      '- وصف الوظيفة ممكن يكون بأي لغة (ألماني، إنجليزي، عربي...). افهمه بلغته وقيّمه عادي، بس "whyMatch" و"gaps" دايمًا بالمصري مهما كانت لغة الوظيفة — متنقلش جمل من الوصف بلغتها. المتطلبات اللي مكتوبة بلغة تانية اكتبها بالمصري، وأسماء المهارات والأدوات بالإنجليزي (مثلًا "Deutschkenntnisse" تبقى "مطلوب لغة ألماني"، و"Erfahrung mit PyTorch" تبقى "مطلوب خبرة PyTorch").',
      '- فرّق بين المطلوب والمفضّل: "مطلوب ..." بس للي الوصف بيطلبه صراحةً. اللي الوصف بيقول إنه ميزة إضافية بس ("von Vorteil"، "wünschenswert"، "nice to have"، "a plus"، "preferred") اكتبه "يفضّل ..." (مثلًا "يفضّل معرفة بالألماني")، ومتنزلش الـ "match" عشانه كتير.',
      '- لو الوظيفة طالبة لغة (زي الألماني) والمرشح مش كاتبها في "languages" أو مستواه فيها أقل من المطلوب، دي نقص يتكتب في "gaps".',
      '- متتكلمش عن المكان أو المرتب أو نوع الدوام — دي فلاتر اتطبقت قبل كده.',
      '- اللغة: كل سطر في "whyMatch" و"gaps" جملة بالمصري بحروف عربي، تبدأ بكلمة عربي (زي "خبرة"، "بكالوريوس"، "مطلوب"، "يفضّل") أو برقم. أسماء المهارات والأدوات بالإنجليزي جوه الجملة عادي، لكن سطر كله إنجليزي مرفوض حتى لو أسماء مهارات بس: "Python, SQL" ✗ — "خبرة Python و SQL" ✓، "Bachelor of Computer Science" ✗ — "بكالوريوس Computer Science" ✓. بيانات المرشح والوظايف بالإنجليزي، بس ردك بالمصري.',
      '- كل "jobId" من القايمة لازم يظهر مرة واحدة بالظبط، بنفس الـ id المكتوب.',
      'رد بكائن JSON بس، من غير أي نص قبله أو بعده، بالشكل ده بالظبط:',
      '{"matches": [{"jobId": string, "match": number, "whyMatch": string[], "gaps": string[]}]}',
    ].join('\n'),
  };

  const user: LlmMessage = {
    role: 'user',
    content: ['المرشح:', JSON.stringify(candidate), '', 'تذكير: كل سطر في "whyMatch" و"gaps" بالمصري بحروف عربي، وأسماء المهارات بالإنجليزي جواه.', '', JOB_MATCH_JOBS_HEADER, JSON.stringify(jobs)].join('\n'),
  };

  return [system, user];
}
