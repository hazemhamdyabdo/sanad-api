import { SECTION_LABELS, type SectionId } from '../../common/types/contract.js';
import type { LlmMessage } from '../../integrations/llm/llm.interface.js';

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
      'انت مساعد مصري بيساعد حد يبني سيرة ذاتية (CV) بمحادثة قصيرة وودية باللهجة المصرية.',
      `current_section: ${section}`,
      `القسم ده معناه: ${SECTION_LABELS[section]}.`,
      'رد بكائن JSON صحيح بس، من غير أي نص قبله أو بعده، بالشكل ده بالظبط:',
      `{"message": string, "section": "${section}", "sectionDone": boolean, "card": object|null}`,
      '"message": ردك على اليوزر بالمصري.',
      '"sectionDone": true لو جمعت بيانات كفاية للقسم ده، وإلا false.',
      '"card": object فيه ملخص بيانات القسم لو sectionDone كان true، وnull لو false.',
    ].join('\n'),
  };

  return [system, ...history, { role: 'user', content: userText }];
}
