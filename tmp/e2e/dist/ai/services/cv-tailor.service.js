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
var CvTailorService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EXTRACTION_LLM_PROVIDER } from '../../integrations/llm/llm.interface.js';
import { buildCvTailorPrompt } from '../prompts/cv-tailor.prompt.js';
import { cvTailorOutputSchema } from '../schemas/cv-tailor.schema.js';
const MAX_ATTEMPTS = 2;
const TAILOR_MAX_TOKENS = 3_000;
function extractJsonObject(raw) {
    const trimmed = raw.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    return start === -1 || end < start ? trimmed : trimmed.slice(start, end + 1);
}
function factTokens(bullet) {
    const words = bullet.match(/[\p{L}\p{N}][\p{L}\p{N}.+#%/-]*/gu) ?? [];
    return words
        .filter((word, index) => /\d/.test(word) || /.\p{Lu}/u.test(word) || /[.+#]/.test(word.replace(/\.$/, '')) || (index > 0 && /^\p{Lu}/u.test(word)))
        .map((word) => word.replace(/[.,;:]+$/, '').toLowerCase());
}
function introducesNewFacts(bullet, entrySource) {
    const source = entrySource.toLowerCase();
    return factTokens(bullet).some((token) => !source.includes(token));
}
function acceptBullets(original, proposed, entrySource) {
    if (!proposed || proposed.length !== original.length) {
        return null;
    }
    return proposed.some((bullet) => introducesNewFacts(bullet, entrySource)) ? null : proposed;
}
function acceptSkillOrder(skills, proposed) {
    const byKey = new Map(skills.map((skill) => [skill.trim().toLowerCase(), skill]));
    const ordered = [];
    for (const name of proposed) {
        const skill = byKey.get(name.trim().toLowerCase());
        if (skill && !ordered.includes(skill))
            ordered.push(skill);
    }
    return [...ordered, ...skills.filter((skill) => !ordered.includes(skill))];
}
let CvTailorService = CvTailorService_1 = class CvTailorService {
    llm;
    logger = new Logger(CvTailorService_1.name);
    constructor(llm) {
        this.llm = llm;
    }
    async tailor(cv, job) {
        const untouched = {
            experienceBullets: cv.experience.map((entry) => entry.bullets),
            projectBullets: cv.projects.map((entry) => entry.bullets),
            skillOrder: cv.skills,
            tailored: false,
        };
        const hasBullets = [...cv.experience, ...cv.projects].some((entry) => entry.bullets.length > 1);
        if (!hasBullets && cv.skills.length < 2) {
            return untouched;
        }
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            let raw;
            try {
                raw = await this.llm.complete({ messages: buildCvTailorPrompt(cv, job), temperature: 0, jsonMode: true, maxTokens: TAILOR_MAX_TOKENS });
            }
            catch (error) {
                this.logger.warn(`CV tailoring call failed on attempt ${attempt + 1}: ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
            let parsed;
            try {
                parsed = JSON.parse(extractJsonObject(raw));
            }
            catch {
                this.logger.warn(`CV tailoring output was not valid JSON on attempt ${attempt + 1}.`);
                continue;
            }
            const result = cvTailorOutputSchema.safeParse(parsed);
            if (!result.success) {
                this.logger.warn(`CV tailoring output failed validation on attempt ${attempt + 1}: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`);
                continue;
            }
            const proposedExperience = new Map(result.data.experience.map((entry) => [entry.index, entry.bullets]));
            const proposedProjects = new Map(result.data.projects.map((entry) => [entry.index, entry.bullets]));
            let rejectedEntries = 0;
            let acceptedEntries = 0;
            const experienceBullets = cv.experience.map((entry, index) => {
                const accepted = acceptBullets(entry.bullets, proposedExperience.get(index), [entry.title, entry.company, ...entry.bullets].join('\n'));
                if (accepted?.some((bullet, position) => bullet !== entry.bullets[position]))
                    acceptedEntries++;
                else if (!accepted && entry.bullets.length)
                    rejectedEntries++;
                return accepted ?? entry.bullets;
            });
            const projectBullets = cv.projects.map((entry, index) => {
                const accepted = acceptBullets(entry.bullets, proposedProjects.get(index), [entry.title, entry.description, ...entry.bullets].join('\n'));
                if (accepted?.some((bullet, position) => bullet !== entry.bullets[position]))
                    acceptedEntries++;
                else if (!accepted && entry.bullets.length)
                    rejectedEntries++;
                return accepted ?? entry.bullets;
            });
            const skillOrder = acceptSkillOrder(cv.skills, result.data.skillOrder);
            if (rejectedEntries) {
                this.logger.warn(`CV tailoring: kept the original bullets for ${rejectedEntries} entr${rejectedEntries === 1 ? 'y' : 'ies'} (wrong bullet count or a fact not in the CV).`);
            }
            const skillsChanged = skillOrder.some((skill, index) => skill !== cv.skills[index]);
            return { experienceBullets, projectBullets, skillOrder, tailored: acceptedEntries > 0 || skillsChanged };
        }
        this.logger.warn('CV tailoring failed after all attempts — using the CV as written.');
        return untouched;
    }
};
CvTailorService = CvTailorService_1 = __decorate([
    Injectable(),
    __param(0, Inject(EXTRACTION_LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], CvTailorService);
export { CvTailorService };
//# sourceMappingURL=cv-tailor.service.js.map