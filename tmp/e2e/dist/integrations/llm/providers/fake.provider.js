const MULTI_ENTRY_SECTIONS = ['experience', 'education', 'certificates'];
const CLOSE_SIGNAL = /مفيش|خلاص|no more|that'?s all|^done$/i;
const NO_EXPERIENCE_SIGNAL = /مشتغلش|مشتغلتش|معنديش خبرة|لسه متخرج/;
const EXTRACTION_MARKER = 'استخرج البيانات';
const CV_ANALYSIS_MARKER = 'حلل ملف السيرة الذاتية';
const JOB_MATCH_MARKER = 'قيّم مدى مناسبة الوظايف';
const JOB_MATCH_JOBS_HEADER = 'الوظايف:';
function buildFakeJobMatchReply(userContent) {
    const [candidatePart, jobsPart = '[]'] = userContent.split(`\n${JOB_MATCH_JOBS_HEADER}\n`);
    const words = (text) => new Set(text.toLowerCase().match(/[\p{L}\p{N}+#]{3,}/gu) ?? []);
    const candidateWords = words(candidatePart);
    const jobs = JSON.parse(jobsPart);
    return {
        matches: jobs.map((job) => {
            const shared = [...words(`${job.title} ${job.description}`)].filter((word) => candidateWords.has(word));
            return {
                jobId: job.id,
                match: Math.min(95, 45 + shared.length * 8),
                whyMatch: shared.length ? [`خبرتك في ${shared.slice(0, 2).join(' و')} (fake)`] : ['المجال قريب من خبرتك (fake)'],
                gaps: shared.length < 3 ? ['مش واضح إن عندك كل المهارات المطلوبة (fake)'] : [],
            };
        }),
    };
}
const CV_TAILOR_MARKER = 'Tailor this CV to one job listing';
const CV_TAILOR_JOB_HEADER = 'JOB LISTING:';
function buildFakeTailorReply(userContent) {
    const [cvPart, jobPart = '{}'] = userContent.split(`\n${CV_TAILOR_JOB_HEADER}\n`);
    const cv = JSON.parse(cvPart.replace(/^CV:\n/, ''));
    const listing = jobPart.toLowerCase();
    const mentioned = cv.skills.filter((skill) => listing.includes(skill.toLowerCase()));
    return {
        experience: cv.experience.map((entry) => ({ index: entry.index, bullets: [...entry.bullets].reverse() })),
        projects: cv.projects.map((entry) => ({ index: entry.index, bullets: [...entry.bullets].reverse() })),
        skillOrder: [...mentioned, ...cv.skills.filter((skill) => !mentioned.includes(skill))],
    };
}
const FAKE_CV_ANALYSIS = {
    cv: {
        basic: { name: 'Fake User', title: 'Fake Title', phone: '+201000000000', email: 'fake@example.com', location: 'Cairo, Egypt' },
        experience: [{ title: 'Fake Title', company: 'Fake Co', start: '2022', end: null, bullets: ['Did fake work'] }],
        projects: [],
        education: [{ degree: 'Fake Degree', school: 'Fake University', year: '2020' }],
        certificates: [],
        skills: [{ name: 'Fake Skill', level: 'intermediate' }],
        languages: [{ name: 'Arabic', level: 'native' }],
    },
    seniority: 'mid',
    yearsOfExperience: 2,
    skills: {
        technical: [{ name: 'Fake Skill', level: 'intermediate', yearsUsed: 2 }],
        tools: [],
        soft: [],
    },
    domains: ['fake-domain'],
    strengths: ['خبرة واضحة في المجال'],
    gaps: ['مفيش شهادات مذكورة'],
    qualityIssues: [{ type: 'no_metrics', description: 'الخبرات من غير أرقام واضحة' }],
    overallScore: 70,
    scoreReason: 'سيرة ذاتية تجريبية (fake) — للاختبار بس',
};
const FAKE_CARD_BY_SECTION = {
    basic: (userText) => ({ name: userText, title: null, phone: null, email: null, location: null }),
    projects: (userText) => ({ title: userText, description: 'A fake project', bullets: ['Did fake work'] }),
    skills: (userText) => [{ name: userText, level: 'intermediate' }],
    languages: (userText) => [{ name: userText, level: 'intermediate' }],
};
const FAKE_ENTRY_BY_SECTION = {
    experience: (userText) => ({ title: userText, company: 'Fake Co', start: '2022', end: null, bullets: ['Did fake work'] }),
    education: (userText) => ({ degree: userText, school: 'Fake University', year: '2020' }),
    certificates: (userText) => ({ name: userText, date: null }),
};
function isMultiEntrySection(section) {
    return MULTI_ENTRY_SECTIONS.includes(section);
}
export class FakeLlmProvider {
    async complete(options) {
        return JSON.stringify(this.buildReply(options));
    }
    async *stream(options) {
        yield JSON.stringify(this.buildReply(options));
    }
    buildReply(options) {
        const system = options.messages.find((message) => message.role === 'system')?.content ?? '';
        const section = (/current_section:\s*(\w+)/.exec(system)?.[1] ?? 'basic');
        if (system.includes(CV_ANALYSIS_MARKER)) {
            return FAKE_CV_ANALYSIS;
        }
        if (system.includes(CV_TAILOR_MARKER)) {
            return buildFakeTailorReply(this.lastUserMessage(options));
        }
        if (system.includes(JOB_MATCH_MARKER)) {
            return buildFakeJobMatchReply(this.lastUserMessage(options));
        }
        if (system.includes(EXTRACTION_MARKER)) {
            return this.buildExtractionReply(section, options);
        }
        return this.buildConversationReply(section, options);
    }
    buildConversationReply(section, options) {
        const userText = this.lastUserMessage(options);
        if (section === 'experience' && NO_EXPERIENCE_SIGNAL.test(userText)) {
            return { message: 'ولا يهمك، ده طبيعي. هنتكلم عن مشاريعك بدل كده.', sectionDone: true, hasNoExperience: true };
        }
        if (isMultiEntrySection(section)) {
            const isClosing = CLOSE_SIGNAL.test(userText);
            return isClosing
                ? { message: 'تمام خلاص، هبقى أعرضلك كل اللي جمعناه.', sectionDone: true }
                : { message: 'تمام، وفي حاجة تانية تحب تضيفها؟', sectionDone: false };
        }
        const sectionDone = userText.trim().length > 15;
        return {
            message: sectionDone
                ? 'تمام، فهمت. أعتقد جمعنا بيانات كفاية للقسم ده دلوقتي.'
                : 'تمام، ممكن تحكيلي كمان شوية عن كده؟',
            sectionDone,
        };
    }
    buildExtractionReply(section, options) {
        const userMessages = options.messages.filter((message) => message.role === 'user').map((message) => message.content);
        if (isMultiEntrySection(section)) {
            return userMessages.filter((text) => !CLOSE_SIGNAL.test(text)).map((text) => FAKE_ENTRY_BY_SECTION[section](text));
        }
        const lastText = userMessages.at(-1) ?? '';
        return FAKE_CARD_BY_SECTION[section](lastText);
    }
    lastUserMessage(options) {
        return [...options.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    }
}
//# sourceMappingURL=fake.provider.js.map