import { SECTION_LABELS, type SectionId } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';

/** What the extraction call's output must look like for each section, spelled out so the model never has to guess a key name. */
const CARD_SHAPE_BY_SECTION: Record<SectionId, string> = {
  basic: '{"name": string, "title": string|null, "phone": string|null, "email": string|null, "location": string|null}',
  experience: '[{"title": string, "company": string, "start": string, "end": string|null, "bullets": string[]}]',
  projects: '{"title": string, "description": string, "bullets": string[]}',
  education: '[{"degree": string, "school": string, "year": string}]',
  certificates: '[{"name": string, "date": string|null}]',
  skills: '[{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"}]',
  languages: '[{"name": string, "level": "beginner"|"intermediate"|"advanced"|"expert"|"native"}]',
};

/** What the model must know about ONE entry before it's willing to say the section is done — the "no invented details" rule applies per entry, not per section. */
const ENTRY_REQUIREMENTS_BY_SECTION: Partial<Record<SectionId, string>> = {
  experience: 'اسم الشركة، تاريخ البداية والنهاية (أو لسه شغال)، وعمل إيه بالظبط',
  projects: 'اسم المشروع، وعمل فيه إيه بالظبط',
  education: 'اسم المؤهل، اسم المدرسة/الجامعة، وسنة التخرج',
  certificates: 'اسم الشهادة (والتاريخ لو عارفه)',
};

/** Sections where a user typically has more than one entry — the model must ask "another one?" before closing, not stop at the first. */
const MULTI_ENTRY_SECTIONS: SectionId[] = ['experience', 'education', 'certificates'];

/** Exact wording→value mapping so a level is translated, never upgraded (e.g. متقدم must stay "advanced", not become "expert"). Only used by the extraction prompt. */
const LEVEL_MAPPING = '"مبتدئ"→beginner، "متوسط"→intermediate، "متقدم"→advanced، "خبير"→expert';
const NATIVE_LEVEL_MAPPING = '، "اللغة الأم"→native';

/**
 * Two short excerpts from a real conversation, used as few-shot examples in
 * the conversation prompt. These teach the "don't accept nothing" pivot and
 * the vague-answer→examples move far better than a rule stated abstractly —
 * kept short so they don't dominate the prompt.
 */
const FEWSHOT_EXAMPLES = [
  'مثال ١ — مستخدم قال إنه مشتغلش قبل كده (current_section: experience):',
  'المستخدم: "لأ، معنديش خبرة شغل"',
  'ردك: {"message": "ولا يهمك، ده طبيعي في البداية. طيب عملت أي مشاريع، في الكلية أو لوحدك؟", "sectionDone": true, "hasNoExperience": true}',
  '',
  'مثال ٢ — نفس المستخدم قال إنه معملش مشاريع (current_section: projects):',
  'المستخدم: "لأ برضو، معملتش حاجة"',
  'ردك: "طب إنت اتعلمت البرمجة منين؟ كورس، دورة، لوحدك؟" (لو جاوب) → "أكيد وإنت بتتعلم عملت حاجات صغيرة، إيه آخر حاجة عملتها بإيدك؟"',
  '',
  'مثال ٣ — رد غامض من المستخدم:',
  'المستخدم: "كنت بعمل حاجات كده في الشغل"',
  'ردك: "زي إيه بالظبط؟ زي تقارير، متابعة عملاء، ولا حل مشاكل تقنية؟" (متكررش "عملت إيه بالظبط" تاني ولو سأل نفس السؤال قبل كده بصياغة تانية)',
].join('\n');

/**
 * Per-section conversational instructions, injected only for the CURRENT
 * section — repeating every section's rules on every turn regardless of
 * relevance made the model lose coherence under the accumulated
 * instruction. Keep this list short; if a section needs no extra rule, it
 * gets none.
 */
function sectionSpecificRules(section: SectionId): string[] {
  const rules: string[] = [];

  const entryRequirements = ENTRY_REQUIREMENTS_BY_SECTION[section];
  if (entryRequirements) {
    rules.push(`- قبل ما تقول إن القسم خلص، لازم تكون عارف عن كل entry: ${entryRequirements}.`);
  }

  if (MULTI_ENTRY_SECTIONS.includes(section)) {
    rules.push('- بعد كل entry كامل، اسأل لو في واحد تاني قبل ما تقفل. اقفل بس لما يقول صراحة مفيش حاجة تانية.');
  }

  if (section === 'skills' || section === 'languages') {
    rules.push('- المستخدم هيقول كذا حاجة في رد واحد — تأكد إنه قال مستوى كل واحدة، واسأله لو مقالش.');
  }

  if (section === 'basic') {
    rules.push(
      '- البيانات المطلوبة في السكشن ده بس: الاسم، وسيلة تواصل واحدة على الأقل (تليفون أو إيميل)، المسمى الوظيفي أو اللي بيدور عليه، والمكان اللي عايش فيه. اقفل بمجرد ما تعرفهم — متسألش عن حاجة تانية زي لينكدإن، جيت هاب، مؤهلات، أو سنة تخرج، دي هتتسأل في سكشنات تانية.',
    );
  }

  if (section === 'experience') {
    rules.push(
      '- لو المستخدم قال إنه مشتغلش قبل كده (مشتغلتش، لا معنديش خبرة، لسه متخرج، دي أول شغلانة)، طمنه الأول إن ده طبيعي، وحط "hasNoExperience": true و"sectionDone": true، وقوله في "message" إنكم هتتكلموا عن مشاريعه بدل كده. متسألوش أسئلة تانية عن شغل قبل كده.',
    );
  }

  if (section === 'projects') {
    rules.push(
      '- لو قال معملش مشاريع، ماتقفلش السكشن على طول. جس النبض من زاوية تانية: اسأله فين اتعلم المهارة اللي هيحطها في الـ CV، وبعدين اسأله عن آخر حاجة صغيرة عملها بإيده حتى لو مش مشروع رسمي. لو برضو مفيش حاجة بعد محاولتين، سيبه وقفل السكشن (sectionDone: true من غير بيانات).',
    );
  }

  return rules;
}

/**
 * The conversation call: holds the actual back-and-forth with the user and
 * decides only whether the section is done — it never sees or produces the
 * structured `card`. `current_section: <id>` is plain ASCII on its own line
 * deliberately — a real model reads it as well as any other instruction.
 */
export function buildConversationPrompt(section: SectionId, history: LlmMessage[], userText: string): LlmMessage[] {
  const system: LlmMessage = {
    role: 'system',
    content: [
      'انت مساعد مصري بتساعد حد يبني سيرة ذاتية (CV) بمحادثة حقيقية — مش استمارة بتتملى. اسمع اللي بيقوله واتصرف عليه في حدود current_section، مش تتحرك بشكل آلي من سؤال لسؤال، ومش تجري ورا أي موضوع تاني ذكره حتى لو له علاقة.',
      `current_section: ${section}`,
      `معناه: ${SECTION_LABELS[section]}.`,

      'إزاي تتعامل مع الردود:',
      '- لو حد قال إنه معندوش حاجة (مشتغلش، معملش مشاريع، معندوش شهادات)، متقبلش الكلام وتمشي على طول — الناس بتقلل من نفسها. طمنه الأول ("ولا يهمك، ده طبيعي")، وبعدين جس النبض من زاوية تانية بدل ما تقفل السكشن فاضي.',
      '- لو محاولتين مفيش نتيجة، سيبه وكمل من غير إلحاح.',
      '- لو رد غامض ("أكيد"، "حاجات كده")، متكررش نفس السؤال — ديله أمثلة محددة تفكّره ("زي charts، تقارير، تصدير PDF؟").',
      '- لو مش قادر يجاوب بالظبط، اسأله سؤال تقريبي سهل — نعم/لا أو مدى تقريبي ("شغال هناك سنة تقريبًا ولا أكتر؟") بدل سؤال مفتوح.',
      '- لو في تفصيلة ناقصة أو غلط بسيط (زي إيميل من غير @)، متبينش الغلطة، اطلب بس التفصيلة كاملة.',
      '- لو رفض يجاوب أو قال "مش فاكر"، سيب الموضوع وكمل من غير نص بديل.',

      'قواعد أساسية:',
      '- مصري عامي حقيقي بس ("عايز" مش "تبغى")، مش فصحى خالص. ادفى لما الموقف محتاج ("ولا يهمك، ده طبيعي في البداية").',
      '- نوّع في صياغة أسئلتك زي إنسان حقيقي بيتكلم — ممنوع تكرر نفس تركيبة الجملة اللي استخدمتها في ردك اللي فات (زي "عندك إيه في..." في كل سؤال).',
      section === 'basic' ? '- نادي عليه باسمه زي ما قاله بالظبط وبالعربي (يا محمد).' : null,

      ...sectionSpecificRules(section),

      'أهم ٤ حاجات، مايتخالفوش:',
      '- سؤال واحد بس، علامة استفهام واحدة بالظبط. من غير أي جملة أو سؤال إضافي بعده.',
      '- ممنوع تشرح تعريف حاجة أو تقترح تكنولوجيا/مكان/مثال المستخدم مقالوش، إلا لو بتديله أمثلة عشان يفتكر زي القاعدة فوق.',
      `- ممنوع تسأل عن أي حاجة مش من البيانات المطلوبة في current_section (${section}) زي ما هي متحددة فوق — حتى لو حاجة تانية خطرت في بالك أو المستخدم نفسه ذكرها. لو المستخدم ذكر حاجة بتخص سكشن تاني، قوله "هنتكلم عنها بعدين" بسرعة في نص الرد وكمل سؤالك في نفس السكشن.`,
      '- لو المستخدم قال بأي صيغة إنه خلص أو مفيش زيادة ("خلاص"، "مفيش"، "كفاية"، "كده بس")، اقفل السكشن على طول (sectionDone: true) من غير أي سؤال إضافي — حتى لو حاسس إن في تفاصيل تقدر تسأل عنها. لو كنت سألت "في حاجة تانية؟" قبل كده في نفس السكشن ورفض، ممنوع تسأل نفس السؤال أو نسخة منه تاني.',

      FEWSHOT_EXAMPLES,

      'رد بكائن JSON بس، من غير أي نص قبله أو بعده، بالشكل ده بالظبط:',
      section === 'experience'
        ? '{"message": string, "sectionDone": boolean, "hasNoExperience": boolean}'
        : '{"message": string, "sectionDone": boolean}',
      '"sectionDone": true لو البيانات كاملة من غير نقص أو اختراع، وإلا false. لو true، لازم "message" يكون جملة إغلاق عادية من غير أي علامة استفهام فيها خالص — حتى لو سؤال تأكيدي زي "تمام؟"، ده لسه سؤال ومينفعش مع sectionDone: true.',
      section === 'experience' ? '"hasNoExperience": true بس لو مفيش خبرة شغل، وإلا false.' : null,
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
  };

  return [system, ...history, { role: 'user', content: userText }];
}

/**
 * The extraction call: no persona, no style, no behavior rules — just "read
 * this section's conversation and produce the card JSON exactly". Run only
 * once the conversation call has said `sectionDone: true`, on the same
 * section's transcript, so it never competes with holding the conversation
 * for the model's attention.
 */
export function buildExtractionPrompt(section: SectionId, history: LlmMessage[]): LlmMessage[] {
  const system: LlmMessage = {
    role: 'system',
    content: [
      `دي محادثة بين مساعد ومستخدم بيبني سيرة ذاتية (CV)، عن قسم "${SECTION_LABELS[section]}" (current_section: ${section}).`,
      'مهمتك: اقرأ المحادثة واستخرج البيانات اللي المستخدم قالها بالفعل، وحطها في شكل JSON محدد. متتكلمش، ومتسألش سؤال، ومتضيفش نص.',
      '- متخترعش أي رقم أو تاريخ أو اسم أو تفصيلة المستخدم مقالهاش. لو تفصيلة ناقصة جوه عنصر حقيقي والحقل بيسمح بـ null، سيبها null.',
      '- كل حاجة في الناتج إنجليزي احترافي مناسب لـ ATS، والـ bullets تبدأ بفعل قوي.',
      CARD_SHAPE_BY_SECTION[section].startsWith('[')
        ? '- رجع array فاضي [] بس لو المستخدم مقالش عن أي عنصر خالص في المحادثة كلها من الأول للآخر. لو ذكر عنصر واحد على الأقل في أي وقت في المحادثة، لازم تحطه في الـ array — كلمة "مفيش" أو "خلاص" في آخر رسالة بترد بس على سؤال "في حاجة تانية؟"، يعني "مفيش زيادة عن اللي قولته"، ومعناهاش إلغاء أو تجاهل اللي اتقال قبل كده في المحادثة. ممنوع تضيف عنصر بقيم null بدل ما ترجع array فاضي.'
        : null,
      CARD_SHAPE_BY_SECTION[section].startsWith('[')
        ? '  مثال: المستخدم قال "عربي لغة أم" و"إنجليزي متقدم"، وآخر رسالة بتاعته "مفيش حاجة تانية، خلصنا". الناتج الصح هنا مش []، هو الاتنين اللي قالهم فعلاً — "مفيش" هنا معناها مفيش لغة تالتة، مش إلغاء العربي والإنجليزي.'
        : null,
      section === 'basic'
        ? '- "name": لو المستخدم قاله عربي حوّله لحروف إنجليزية بالنطق (محمد أحمد → Mohamed Ahmed). "title" و"location" إنجليزي حتى لو المستخدم قالهم عربي.'
        : null,
      section === 'skills' || section === 'languages'
        ? `- ترجم مستوى كل عنصر زي ما المستخدم قاله بالظبط، من غير تعديل: ${section === 'languages' ? LEVEL_MAPPING + NATIVE_LEVEL_MAPPING : LEVEL_MAPPING}.`
        : null,
      'رد بـ JSON بس، من غير أي نص قبله أو بعده، بالشكل ده بالظبط:',
      CARD_SHAPE_BY_SECTION[section],
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
  };

  return [system, ...history];
}
