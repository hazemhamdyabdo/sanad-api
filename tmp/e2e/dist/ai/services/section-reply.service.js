var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SectionReplyService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EXTRACTION_LLM_PROVIDER, LLM_PROVIDER } from '../../integrations/llm/llm.interface.js';
import { buildConversationPrompt, buildExtractionPrompt } from '../prompts/section-reply.prompt.js';
import { CARD_SCHEMA_BY_SECTION, conversationReplySchema } from '../schemas/section-reply.schema.js';
const SOFT_FALLBACK_MESSAGE = 'معلش، ممكن تقولهالي تاني؟';
const CLARIFY_QUESTIONS_BY_SECTION = {
    basic: ['معلش، عايز أكتبها صح — ممكن تقولي اسمك بالكامل تاني؟', 'تمام، وإيه المسمى الوظيفي اللي تحب يتكتب في الـ CV؟'],
    experience: [
        'معلش، عايز أكتبها صح — إيه المسمى الوظيفي بالظبط، وكنت شغال في أنهي شركة أو مكان؟',
        'تمام، وكنت بتعمل إيه هناك بالظبط؟ قولي حاجتين أو تلاتة من شغلك اليومي.',
        'خليني أتأكد — كنت شغال فين، وبتعمل إيه هناك في جملة واحدة؟',
    ],
    projects: [
        'معلش، عايز أكتبها صح — إيه اسم المشروع، وكان بيعمل إيه باختصار؟',
        'تمام، وإنت بالظبط عملت إيه فيه؟ قولي حاجتين أو تلاتة.',
    ],
    education: [
        'معلش، عايز أكتبها صح — إيه اسم المؤهل بالظبط، ومن أنهي جامعة أو مدرسة؟',
        'خليني أتأكد — اتخرجت من أنهي كلية أو مدرسة، والشهادة اسمها إيه؟',
    ],
    certificates: [
        'معلش، عايز أكتبها صح — إيه اسم الشهادة أو الكورس بالظبط؟',
        'خليني أتأكد — الكورس ده كان اسمه إيه، ومن أنهي جهة؟',
    ],
    skills: [
        'معلش، عايز أكتبها صح — قولي المهارات تاني، وجنب كل واحدة مستواك: مبتدئ، متوسط، متقدم، ولا خبير؟',
        'خليني أتأكد — إيه المهارات اللي تحب تتكتب، ومستواك في كل واحدة؟',
    ],
    languages: [
        'معلش، عايز أكتبها صح — إيه اللغات اللي بتتكلمها، ومستواك في كل واحدة؟ (العربي لغة أم مثلًا)',
        'خليني أتأكد — قولي كل لغة ومستواك فيها.',
    ],
};
const SECTIONS_ALLOWED_EMPTY = ['certificates'];
function clarifyingQuestion(section, history) {
    const questions = CLARIFY_QUESTIONS_BY_SECTION[section];
    const alreadyAsked = history.filter((entry) => entry.role === 'assistant' && questions.includes(entry.content)).length;
    return questions[alreadyAsked % questions.length];
}
const JSON_ONLY_REMINDER = 'رد بكائن JSON بس، من غير أي نص قبله أو بعده.';
const CONVERSATION_RETRY_REMINDERS = [JSON_ONLY_REMINDER, 'حاول تاني بصياغة سؤال مختلفة، ورد بكائن JSON بس زي ما اتطلب من غير أي نص تاني.'];
const EMPTY_ARRAY_REMINDER = 'راجع المحادثة تاني بالكامل، من أول رسالة للآخر — هل ذكر المستخدم أي عنصر فعلي في أي رسالة من رسايله في أي وقت؟ لو أيوه، لازم يتحط في الـ array حتى لو آخر رسالة بتاعته بتقول "مفيش" أو "خلاص". رجع array فاضي [] بس لو مفيش أي عنصر اتقال فعلاً من الأول للآخر.';
const CLOSING_INTENT = /خلاص|مفيش|بس كد[اه]|كد[اه] بس|تمام كد[اه]|كد[اه] تمام|كفاية|خلصنا|خلصت|^(لا|لأ|لاء)[،,]?\s*(شكر|تمام|مفيش|خلاص)/;
const MAX_MESSAGE_LENGTH_FOR_CLOSING_INTENT = 40;
function hasClosingIntent(userText) {
    const trimmed = userText.trim();
    return trimmed.length <= MAX_MESSAGE_LENGTH_FOR_CLOSING_INTENT && CLOSING_INTENT.test(trimmed);
}
const NEUTRAL_CLOSING_MESSAGE = 'تمام، خلصنا القسم ده.';
const MODEL_CLOSING_PHRASE = /بص عليها تحت|بص عليه تحت|بصي عليها تحت|خلصنا/;
function soundsLikeClosing(message) {
    return MODEL_CLOSING_PHRASE.test(message) && !/[؟?]/.test(message);
}
const REQUIRED_FIELD_ASK_LIMIT = 1;
const REQUIRED_FIELDS_BY_SECTION = {
    basic: [
        { fields: ['title'], ask: 'طب إيه المسمى الوظيفي بتاعك، أو الوظيفة اللي بتدور عليها؟', mention: /المسمى الوظيفي/i },
        { fields: ['phone', 'email'], ask: 'ممكن آخد رقم موبايلك أو إيميلك؟', mention: /رقم موبايلك أو إيميلك/i },
    ],
};
for (const rules of Object.values(REQUIRED_FIELDS_BY_SECTION)) {
    for (const rule of rules ?? []) {
        if (!rule.mention.test(rule.ask)) {
            throw new Error(`RequiredFieldRule misconfigured: mention pattern ${rule.mention} doesn't match its own ask text "${rule.ask}".`);
        }
    }
}
function hasEntries(card) {
    if (!card)
        return false;
    return Array.isArray(card) ? card.length > 0 : Object.keys(card).length > 0;
}
function countAssistantMentions(history, pattern) {
    return history.filter((entry) => entry.role === 'assistant' && pattern.test(entry.content)).length;
}
function findUnmetRequiredField(rules, card, history) {
    for (const rule of rules) {
        const satisfied = rule.fields.some((field) => !!card[field]);
        if (satisfied) {
            continue;
        }
        if (countAssistantMentions(history, rule.mention) < REQUIRED_FIELD_ASK_LIMIT) {
            return rule;
        }
    }
    return null;
}
function sanitizeForcedCloseMessage(message) {
    if (!/[؟?]/.test(message)) {
        return message;
    }
    const sentences = message.split(/(?<=[.!])\s*/).filter((sentence) => sentence.trim().length > 0);
    const withoutQuestion = sentences.filter((sentence) => !/[؟?]/.test(sentence)).join(' ').trim();
    return withoutQuestion.length > 5 ? withoutQuestion : NEUTRAL_CLOSING_MESSAGE;
}
function extractJsonObject(raw) {
    const trimmed = raw.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
        return trimmed;
    }
    return trimmed.slice(start, end + 1);
}
function extractJsonValue(raw) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
        const end = trimmed.lastIndexOf(']');
        return end === -1 ? trimmed : trimmed.slice(0, end + 1);
    }
    return extractJsonObject(raw);
}
function dropAllNullEntries(parsed) {
    if (!Array.isArray(parsed)) {
        return parsed;
    }
    return parsed.filter((entry) => !(entry && typeof entry === 'object' && Object.values(entry).every((value) => value === null)));
}
const ARABIC_CHAR = '[\\u0600-\\u06FF]';
const LATIN_CHAR = '[A-Za-z]';
const ARABIC_THEN_LATIN = new RegExp(`(${ARABIC_CHAR})(${LATIN_CHAR})`, 'g');
const LATIN_THEN_ARABIC = new RegExp(`(${LATIN_CHAR})(${ARABIC_CHAR})`, 'g');
function insertArabicLatinBoundarySpace(text) {
    return text.replace(ARABIC_THEN_LATIN, '$1 $2').replace(LATIN_THEN_ARABIC, '$1 $2');
}
const CONVERSATION_CALL = 'conversation';
const EXTRACTION_CALL = 'extraction';
let SectionReplyService = SectionReplyService_1 = class SectionReplyService {
    llm;
    extractionLlm;
    logger = new Logger(SectionReplyService_1.name);
    constructor(llm, extractionLlm) {
        this.llm = llm;
        this.extractionLlm = extractionLlm;
    }
    async generate(section, history, userText, previousBestCard) {
        const convMessages = buildConversationPrompt(section, history, userText);
        const convOutcome = await this.completeWithRetries(convMessages, extractJsonObject, (value) => conversationReplySchema.safeParse(value), CONVERSATION_RETRY_REMINDERS);
        if (!convOutcome.success) {
            this.logger.warn(`Conversation call failed after all retries (section: ${section}) — falling back to a soft in-character message.`);
            return { message: SOFT_FALLBACK_MESSAGE, section, sectionDone: false, hasNoExperience: false, card: null };
        }
        const message = insertArabicLatinBoundarySpace(convOutcome.data.message);
        const hasNoExperience = section === 'experience' && convOutcome.data.hasNoExperience;
        let sectionDone = convOutcome.data.sectionDone;
        let finalMessage = message;
        if (!sectionDone && !hasNoExperience && soundsLikeClosing(message)) {
            this.logger.warn(`Model wrote a closing message but sectionDone: false (section: ${section}) — overriding to true.`);
            sectionDone = true;
        }
        const closingIntentFired = !hasNoExperience && hasClosingIntent(userText);
        if (closingIntentFired) {
            if (!sectionDone) {
                this.logger.warn(`User signaled closing intent ("${userText}") — overriding sectionDone to true (section: ${section}).`);
            }
            sectionDone = true;
        }
        if (sectionDone && !hasNoExperience && /[؟?]/.test(finalMessage)) {
            if (closingIntentFired) {
                finalMessage = sanitizeForcedCloseMessage(finalMessage);
                this.logger.warn(`Forced close still had a trailing question (section: ${section}) — message sanitized.`);
            }
            else {
                this.logger.warn(`Conversation call said sectionDone: true while still asking a question (section: ${section}) — overriding to false.`);
                sectionDone = false;
            }
        }
        let card = null;
        if (sectionDone && !hasNoExperience) {
            const fullHistory = [...history, { role: 'user', content: userText }];
            const closingMessageOnly = hasClosingIntent(userText) && history.length > 0;
            const extraction = await this.extractCard(section, fullHistory, closingMessageOnly, previousBestCard);
            card = extraction.kind === 'card' ? extraction.card : null;
            if (card && previousBestCard && !Array.isArray(card) && !Array.isArray(previousBestCard)) {
                const suppliedValues = Object.fromEntries(Object.entries(card).filter(([, value]) => value !== null && value !== undefined && value !== ''));
                card = { ...previousBestCard, ...suppliedValues };
            }
            if (extraction.kind === 'empty' && SECTIONS_ALLOWED_EMPTY.includes(section)) {
                card = [];
            }
            if (card === null && hasEntries(previousBestCard)) {
                this.logger.warn(`Extraction failed but a prior card exists (section: ${section}) — reusing it.`);
                card = previousBestCard;
            }
            if (card === null) {
                this.logger.warn(`No card for section ${section} (${extraction.kind}) — asking the user to clarify.`);
                finalMessage = clarifyingQuestion(section, history);
                sectionDone = false;
            }
            else if (Array.isArray(card) && Array.isArray(previousBestCard) && card.length < previousBestCard.length) {
                this.logger.warn(`New extraction (${card.length} entries) is smaller than a prior one (${previousBestCard.length}) for section ${section} — keeping the larger one.`);
                card = previousBestCard;
            }
            else if (!Array.isArray(card)) {
                const rules = REQUIRED_FIELDS_BY_SECTION[section];
                const unmet = rules ? findUnmetRequiredField(rules, card, history) : null;
                if (unmet) {
                    this.logger.warn(`${section} would close missing a required field (one of: ${unmet.fields.join('/')}) — forcing one more turn.`);
                    sectionDone = false;
                    card = null;
                    finalMessage = unmet.ask;
                }
            }
        }
        return { message: finalMessage, section, sectionDone, hasNoExperience, card };
    }
    async extractCard(section, sectionHistory, closingMessageOnly = false, existingCard) {
        const extractionMessages = buildExtractionPrompt(section, sectionHistory, closingMessageOnly, existingCard);
        const parse = (value) => {
            const result = CARD_SCHEMA_BY_SECTION[section].safeParse(dropAllNullEntries(value));
            return result.success ? { success: true, data: result.data } : { success: false, error: { issues: result.error.issues } };
        };
        const outcome = await this.completeWithRetries(extractionMessages, extractJsonValue, parse, [JSON_ONLY_REMINDER], EXTRACTION_CALL);
        if (!outcome.success) {
            this.logger.warn(`Extraction failed after all retries (section: ${section}).`);
            return { kind: 'failed' };
        }
        const hadMultipleUserTurns = sectionHistory.filter((entry) => entry.role === 'user').length > 1;
        if (Array.isArray(outcome.data) && outcome.data.length === 0 && hadMultipleUserTurns) {
            this.logger.warn(`Extraction returned an empty array after multiple user turns (section: ${section}) — re-checking once.`);
            const recheckMessages = [...extractionMessages, { role: 'assistant', content: JSON.stringify(outcome.data) }, { role: 'user', content: EMPTY_ARRAY_REMINDER }];
            const recheckOutcome = await this.completeWithRetries(recheckMessages, extractJsonValue, parse, [], EXTRACTION_CALL);
            if (!recheckOutcome.success) {
                return { kind: 'failed' };
            }
            if (Array.isArray(recheckOutcome.data) && recheckOutcome.data.length === 0) {
                this.logger.warn(`Extraction still empty after re-check (section: ${section}).`);
                return { kind: 'empty' };
            }
            return { kind: 'card', card: recheckOutcome.data };
        }
        return { kind: 'card', card: outcome.data };
    }
    async completeWithRetries(messages, extract, validate, reminders, call = CONVERSATION_CALL) {
        let currentMessages = messages;
        for (let attempt = 0; attempt <= reminders.length; attempt++) {
            const raw = await this.complete(currentMessages, call);
            const parsed = this.tryParse(raw, extract, attempt > 0);
            if (parsed !== undefined) {
                const result = validate(parsed);
                if (result.success) {
                    return result;
                }
                this.logger.warn(`Output failed validation on attempt ${attempt + 1}: ${JSON.stringify(result.error.issues)}`);
            }
            if (attempt < reminders.length) {
                currentMessages = [...currentMessages, { role: 'assistant', content: raw }, { role: 'user', content: reminders[attempt] }];
            }
        }
        return { success: false };
    }
    complete(messages, call) {
        const llm = call === EXTRACTION_CALL ? this.extractionLlm : this.llm;
        return llm.complete({ messages, temperature: call === EXTRACTION_CALL ? 0 : 0.4, jsonMode: true });
    }
    tryParse(raw, extract, isRetry = false) {
        try {
            return JSON.parse(extract(raw));
        }
        catch {
            this.logger.warn(`AI output was not valid JSON${isRetry ? ' (after retry)' : ''}: ${raw}`);
            return undefined;
        }
    }
};
SectionReplyService = SectionReplyService_1 = __decorate([
    Injectable(),
    __param(0, Inject(LLM_PROVIDER)),
    __param(1, Inject(EXTRACTION_LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object])
], SectionReplyService);
export { SectionReplyService };
//# sourceMappingURL=section-reply.service.js.map