import { QUALITY_ISSUE_TYPES, SENIORITY_LEVELS } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';

/** Must appear in the system message — see `FakeLlmProvider`'s `CV_ANALYSIS_MARKER`, which routes to a canned reply by this exact phrase. */
const CV_ANALYSIS_MARKER = 'حلل ملف السيرة الذاتية';

const CV_SHAPE =
  '"cv": {' +
  '"basic": {"name": string, "title": string|null, "phone": string|null, "email": string|null, "location": string|null}, ' +
  '"experience": [{"title": string, "company": string, "start": string|null, "end": string|null, "bullets": string[]}], ' +
  '"projects": [{"title": string, "description": string, "bullets": string[]}], ' +
  '"education": [{"degree": string, "school": string, "year": string|null}], ' +
  '"certificates": [{"name": string, "date": string|null}], ' +
  '"skills": [{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"}], ' +
  '"languages": [{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"|"native"}]' +
  '}';

const SKILL_WITH_YEARS_SHAPE = '{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert", "yearsUsed": number|null}';

/**
 * A one-shot document analysis of an uploaded CV PDF — no conversation history, no persona, just
 * "read this document and produce the analysis JSON". Mirrors `buildExtractionPrompt`'s house
 * style (grounded-only, JSON-only, English CV content) plus the richer, Egyptian-Arabic-facing
 * analysis fields this feature adds on top.
 */
export function buildCvAnalysisPrompt(pdf: Buffer, mimeType: string): LlmMessage[] {
  const system: LlmMessage = {
    role: 'system',
    content: [
      `${CV_ANALYSIS_MARKER} المرفق، واستخرج منه البيانات وحلل جودتها.`,
      '- متخترعش أي رقم أو تاريخ أو اسم أو تفصيلة مش موجودة فعلًا في الملف. لو تفصيلة ناقصة والحقل بيسمح بـ null، سيبها null. لو سكشن كامل مش موجود في الملف خالص، رجّعه array فاضي [].',
      '- كل حاجة جوه "cv" إنجليزي احترافي مناسب لـ ATS (حتى لو الملف الأصلي عربي)، والـ bullets تبدأ بفعل قوي — نفس أسلوب أي CV بيتبني من المحادثة.',
      '- "domains": مجالات الشغل اللي وضحت من الخبرة (زي "fintech", "e-commerce", "retail")، إنجليزي قصير، من غير حدّ أقصى محدد بس متكررش نفس المجال.',
      `- "seniority": واحدة من: ${SENIORITY_LEVELS.join(' / ')} — احكم عليها من سنين الخبرة الفعلية ومستوى المسميات الوظيفية.`,
      '- "yearsOfExperience": إجمالي سنين الخبرة الفعلية (تقريبي لو مش واضح بالظبط)، أو null لو مفيش خبرة شغل خالص.',
      `- "skills": نفس المهارات اللي في "cv.skills" لكن مبوبة تقنية/أدوات/سلوكية (technical/tools/soft)، وكل واحدة معاها "yearsUsed" لو واضح من الملف تقريبًا كام سنة استخدمها، وإلا null. كل عنصر بالشكل: ${SKILL_WITH_YEARS_SHAPE}.`,
      '- "strengths" و"gaps": بالمصري، جمل قصيرة وواضحة، مبنية على المحتوى الفعلي مش عامة.',
      `- "qualityIssues": مشاكل حقيقية في جودة الـ CV نفسه (صياغته أو تنسيقه)، مش في مسيرة الشخص المهنية — كل عنصر "type" من: ${QUALITY_ISSUE_TYPES.join(' / ')}، و"description" بالمصري بيشرح المشكلة بالظبط. رجّع array فاضي لو مفيش مشاكل واضحة.`,
      '- "overallScore": رقم من 0 لـ 100 بيقيّم جودة الـ CV كمستند (وضوح، اكتمال، صياغة، تنسيق ATS) — مش تقييم للشخص نفسه. "scoreReason": جملة أو اتنين بالمصري بتشرح السبب.',
      'رد بكائن JSON بس، من غير أي نص قبله أو بعده، بالشكل ده بالظبط:',
      `{${CV_SHAPE}, "seniority": string, "yearsOfExperience": number|null, "skills": {"technical": [...], "tools": [...], "soft": [...]}, "domains": string[], "strengths": string[], "gaps": string[], "qualityIssues": [{"type": string, "description": string}], "overallScore": number, "scoreReason": string}`,
    ].join('\n'),
  };

  const user: LlmMessage = {
    role: 'user',
    content: 'دي السيرة الذاتية. حللها زي ما اتشرح.',
    documents: [{ data: pdf, mimeType }],
  };

  return [system, user];
}
