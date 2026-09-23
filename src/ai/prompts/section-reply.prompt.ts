import { SECTION_LABELS, type SectionId } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';

/** What `card` must look like for each section, spelled out so the model never has to guess a key name. */
const CARD_SHAPE_BY_SECTION: Record<SectionId, string> = {
  basic: '{"name": string, "title": string|null, "phone": string|null, "email": string|null, "location": string|null}',
  experience: '{"title": string, "company": string, "start": string, "end": string|null, "bullets": string[]}',
  projects: '{"title": string, "description": string, "bullets": string[]}',
  education: '{"degree": string, "school": string, "year": string}',
  certificates: '{"name": string, "date": string|null}',
  skills: '[{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"}]',
  languages: '[{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"|"native"}]',
};

/**
 * `current_section: <id>` is plain ASCII on its own line deliberately — a
 * real model reads it as well as any other instruction, and it's what lets
 * the fake provider (which has no real language understanding) parse out
 * which section it's replying about.
 */
export function buildSectionReplyPrompt(section: SectionId, history: LlmMessage[], userText: string): LlmMessage[] {
  const system: LlmMessage = {
    role: 'system',
    content: [
      'انت مساعد مصري بيساعد حد يبني سيرة ذاتية (CV) بمحادثة قصيرة وودية باللهجة المصرية العامية.',
      `current_section: ${section}`,
      `القسم ده معناه: ${SECTION_LABELS[section]}.`,

      'قواعد صارمة، ممنوع تخالفها:',
      '- متخترعش ولا تفترض أي معلومة: مفيش أرقام أو نسب أو تواريخ أو أسماء أماكن أو إنجازات المستخدم مقالهاش.',
      '- ممنوع تستخدم أي placeholder زي [اسم المحل] أو MM/YYYY. لو حاجة ناقصة، اسأل عنها واستنى الرد — ومتكتبش الـ card لسه.',
      '- لو المستخدم قال مش فاكر أو رفض يجاوب، اكتب العنصر من غير التفصيلة دي، من غير أقواس فاضية أو نص بديل.',

      'أسلوب الكلام:',
      '- مصري عامي بسيط وودود، مش فصحى خالص.',
      '- سؤال واحد بس في كل رسالة، وقصير.',
      '- متكررش اللي المستخدم قاله للتو، كمل قدام في الحوار.',
      '- لو إجابته غامضة أو عامة، اسأل سؤال متابعة يجيبلك رقم أو تفصيلة محددة.',
      section === 'experience'
        ? '- قبل ما تكتب أي experience entry لازم تكون عارف: اسم الشركة، تاريخ البداية والنهاية (أو إنه لسه شغال هناك)، وهو عمل إيه هناك بالظبط.'
        : null,
      section === 'projects'
        ? '- قبل ما تكتب أي project entry لازم تكون عارف: اسم المشروع، وهو عمل فيه إيه بالظبط.'
        : null,
      section === 'skills' || section === 'languages'
        ? '- المستخدم غالبًا هيقولك كذا حاجة في رد واحد (مثلاً كذا مهارة أو كذا لغة) — حطهم كلهم في الـ array، متسيبش ولا واحدة منهم.'
        : null,

      'تقسيم اللغة:',
      '- "message": بالمصري العامي.',
      '- كل حاجة جوه "card": إنجليزي احترافي مناسب لسيرة ذاتية ATS. أي bullet points تبدأ بفعل قوي (Action verb)، وحطّ أرقام بس لو المستخدم قالها هو بالظبط.',

      'رد بكائن JSON صحيح بس، من غير أي نص قبله أو بعده، بالشكل ده بالظبط:',
      `{"message": string, "section": "${section}", "sectionDone": boolean, "card": ${CARD_SHAPE_BY_SECTION[section]}|null}`,
      '"message": ردك على اليوزر بالمصري.',
      '"sectionDone": true لو عندك كل البيانات المطلوبة للقسم ده من غير أي حاجة ناقصة أو مخترعة، وإلا false.',
      `"card": لازم يكون بالظبط ${CARD_SHAPE_BY_SECTION[section]} لو sectionDone كان true، وnull لو false.`,
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
  };

  return [system, ...history, { role: 'user', content: userText }];
}
