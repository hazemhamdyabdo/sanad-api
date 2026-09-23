import { SECTION_LABELS, type SectionId } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';

/** What `card` must look like for each section, spelled out so the model never has to guess a key name. */
const CARD_SHAPE_BY_SECTION: Record<SectionId, string> = {
  basic: '{"name": string, "title": string|null, "phone": string|null, "email": string|null, "location": string|null}',
  experience: '[{"title": string, "company": string, "start": string, "end": string|null, "bullets": string[]}]',
  projects: '{"title": string, "description": string, "bullets": string[]}',
  education: '[{"degree": string, "school": string, "year": string}]',
  certificates: '[{"name": string, "date": string|null}]',
  skills: '[{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"}]',
  languages: '[{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"|"native"}]',
};

/** What the model must know about ONE entry before writing it — the "no invented details" rule applies per entry, not per section. */
const ENTRY_REQUIREMENTS_BY_SECTION: Partial<Record<SectionId, string>> = {
  experience: 'اسم الشركة، تاريخ البداية والنهاية (أو لسه شغال)، وعمل إيه بالظبط',
  projects: 'اسم المشروع، وعمل فيه إيه بالظبط',
  education: 'اسم المؤهل، اسم المدرسة/الجامعة، وسنة التخرج',
  certificates: 'اسم الشهادة (والتاريخ لو عارفه)',
};

/** Sections where a user typically has more than one entry — the model must ask "another one?" before closing, not stop at the first. */
const MULTI_ENTRY_SECTIONS: SectionId[] = ['experience', 'education', 'certificates'];

/** Exact wording→value mapping so a level is translated, never upgraded (e.g. متقدم must stay "advanced", not become "expert"). */
const LEVEL_MAPPING = '"مبتدئ"→beginner، "متوسط"→intermediate، "متقدم"→advanced، "خبير"→expert';
const NATIVE_LEVEL_MAPPING = '، "اللغة الأم"→native';

/**
 * Per-section instructions, injected only for the CURRENT section — a
 * previous version repeated every section's rules on every turn regardless
 * of relevance, and the model started losing coherence under that much
 * accumulated instruction. Keep this list short; if a section needs no
 * extra rule, it gets none.
 */
function sectionSpecificRules(section: SectionId): string[] {
  const rules: string[] = [];

  const entryRequirements = ENTRY_REQUIREMENTS_BY_SECTION[section];
  if (entryRequirements) {
    rules.push(`- قبل ما تضيف أي entry، لازم تكون عارف: ${entryRequirements}.`);
  }

  if (MULTI_ENTRY_SECTIONS.includes(section)) {
    rules.push(
      '- بعد كل entry كامل، اسأل لو في واحد تاني قبل sectionDone: true. اقفل بس لما يقول صراحة مفيش حاجة تانية، وحط كل العناصر في الـ array مرة واحدة.',
    );
  }

  if (section === 'skills' || section === 'languages') {
    const mapping = section === 'languages' ? LEVEL_MAPPING + NATIVE_LEVEL_MAPPING : LEVEL_MAPPING;
    rules.push(`- المستخدم هيقول كذا حاجة في رد واحد — حطهم كلهم في الـ array. ترجم المستوى زي ما قاله بالظبط، من غير تعديل: ${mapping}. لو مقالش مستوى، اسأله.`);
  }

  if (section === 'basic') {
    rules.push(
      '- في "card" بس: كل الحقول إنجليزي، ما عدا "name" لو عربي حوّله لحروف إنجليزية (محمد أحمد → Mohamed Ahmed). "title" و"location" إنجليزي حتى لو المستخدم قالهم عربي.',
      '- في "message": نادي عليه باسمه زي ما قاله بالظبط وبالعربي (يا محمد مش يا Mohamed). التحويل للإنجليزي في الـ card بس.',
    );
  }

  return rules;
}

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
      'انت مساعد مصري بيساعد حد يبني سيرة ذاتية (CV) بمحادثة قصيرة وودية.',
      `current_section: ${section}`,
      `معناه: ${SECTION_LABELS[section]}.`,

      'قواعد أساسية:',
      '- متخترعش أرقام أو تواريخ أو أماكن أو حاجة المستخدم مقالهاش. مفيش placeholders — لو حاجة ناقصة اسأل عنها.',
      '- لو رفض يجاوب أو قال "مش فاكر"، سيب التفصيلة فاضية (null)، من غير نص بديل.',
      '- مصري عامي حقيقي بس ("عايز" مش "تبغى")، مش فصحى خالص.',
      '- كل حاجة جوه "card" إنجليزي احترافي مناسب لـ ATS، والـ bullets تبدأ بفعل قوي.',

      ...sectionSpecificRules(section),

      'أهم حاجتين، مايتخالفوش:',
      '- سؤال واحد بس، علامة استفهام واحدة بالظبط. من غير أي جملة أو سؤال إضافي بعده.',
      '- ممنوع تشرح تعريف حاجة أو تقترح تكنولوجيا/مكان/مثال المستخدم مقالوش.',

      'رد بكائن JSON بس، من غير أي نص قبله أو بعده:',
      `{"message": string, "section": "${section}", "sectionDone": boolean, "card": ${CARD_SHAPE_BY_SECTION[section]}|null}`,
      '"sectionDone": true لو البيانات كاملة من غير نقص أو اختراع، وإلا false. "card" لازم يكون null لو false.',
    ].join('\n'),
  };

  return [system, ...history, { role: 'user', content: userText }];
}
