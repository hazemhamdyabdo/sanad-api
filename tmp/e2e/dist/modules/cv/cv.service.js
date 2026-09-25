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
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { generateId } from '../../common/ids.js';
import { AppError } from '../../common/errors/app-error.js';
import { CvRepository } from './cv.repository.js';
import { toCvAnalysisResponseDto } from './dto/cv-analysis-response.dto.js';
import { ARRAY_SECTIONS, toCvResponseDto } from './dto/cv-response.dto.js';
import { cvPatchSchema } from './schemas/cv-patch.schema.js';
import { CvPdfRenderer } from '../../integrations/pdf/cv-pdf.renderer.js';
let CvService = class CvService {
    cvRepository;
    cvPdfRenderer;
    dataSource;
    constructor(cvRepository, cvPdfRenderer, dataSource) {
        this.cvRepository = cvRepository;
        this.cvPdfRenderer = cvPdfRenderer;
        this.dataSource = dataSource;
    }
    async exportPdf(deviceId) {
        return this.renderPdf(await this.getForDevice(deviceId));
    }
    renderPdf(cv) {
        const safeName = (cv.name ?? 'CV').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'CV';
        return { file: this.cvPdfRenderer.render(cv), filename: `${safeName}-CV.pdf` };
    }
    existsForDevice(deviceId) {
        return this.cvRepository.existsForDevice(deviceId);
    }
    deleteById(id, manager) {
        return this.cvRepository.deleteById(id, manager);
    }
    async confirmSection(deviceId, existingCvId, section, content, isLast, manager) {
        let cv = existingCvId ? await this.cvRepository.findById(existingCvId, manager) : null;
        if (!cv) {
            cv = await this.cvRepository.findByDeviceId(deviceId, manager);
        }
        if (!cv) {
            cv = await this.cvRepository.createCv({
                id: generateId('cv'),
                deviceId,
                isComplete: false,
                confirmedSections: [],
                name: null,
                title: null,
                contact: null,
                summary: null,
            }, manager);
        }
        else if (!existingCvId && section === 'basic') {
            await this.cvRepository.deleteSectionsByCvId(cv.id, manager);
            cv.confirmedSections = [];
            cv.isComplete = false;
            cv.summary = null;
        }
        await this.cvRepository.upsertSection(cv.id, section, content, manager);
        if (section === 'basic' && !Array.isArray(content)) {
            const basic = content;
            cv.name = basic.name ?? null;
            cv.title = basic.title ?? null;
            cv.contact = { phone: basic.phone ?? undefined, email: basic.email ?? undefined, location: basic.location ?? undefined };
        }
        if (!cv.confirmedSections.includes(section)) {
            cv.confirmedSections = [...cv.confirmedSections, section];
        }
        if (isLast) {
            cv.isComplete = true;
        }
        const saved = await this.cvRepository.saveCv(cv, manager);
        return { cvId: saved.id, isComplete: saved.isComplete };
    }
    saveAnalysis(deviceId, uploadId, analysis) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`cv-analysis:${deviceId}`]);
            await this.cvRepository.upsertAnalysis({
                id: generateId('cva'),
                deviceId,
                uploadId,
                cv: analysis.cv,
                sectionConfidence: analysis.sectionConfidence,
                seniority: analysis.seniority,
                yearsOfExperience: analysis.yearsOfExperience,
                skills: analysis.skills,
                domains: analysis.domains,
                strengths: analysis.strengths,
                gaps: analysis.gaps,
                qualityIssues: analysis.qualityIssues,
                overallScore: analysis.overallScore,
                scoreReason: analysis.scoreReason,
            }, manager);
            let cv = await this.cvRepository.findByDeviceId(deviceId, manager);
            if (!cv) {
                cv = await this.cvRepository.createCv({
                    id: generateId('cv'),
                    deviceId,
                    isComplete: false,
                    confirmedSections: [],
                    name: null,
                    title: null,
                    contact: null,
                    summary: null,
                }, manager);
            }
            await this.cvRepository.deleteSectionsByCvId(cv.id, manager);
            cv.confirmedSections = [];
            cv.isComplete = false;
            cv.name = null;
            cv.title = null;
            cv.contact = null;
            cv.summary = null;
            for (const section of Object.keys(analysis.sectionConfidence)) {
                if (analysis.sectionConfidence[section] !== 'high')
                    continue;
                const content = analysis.cv[section];
                await this.cvRepository.upsertSection(cv.id, section, content, manager);
                cv.confirmedSections.push(section);
                if (section === 'basic') {
                    const basic = analysis.cv.basic;
                    cv.name = basic.name;
                    cv.title = basic.title;
                    cv.contact = {
                        phone: basic.phone ?? undefined,
                        email: basic.email ?? undefined,
                        location: basic.location ?? undefined,
                    };
                }
            }
            cv.isComplete = !Object.values(analysis.sectionConfidence).includes('low');
            await this.cvRepository.saveCv(cv, manager);
        });
    }
    async getAnalysisForDevice(deviceId) {
        const analysis = await this.cvRepository.findAnalysisByDeviceId(deviceId);
        return analysis ? toCvAnalysisResponseDto(analysis) : null;
    }
    async getAnalysisForUpload(uploadId, deviceId) {
        const analysis = await this.cvRepository.findAnalysisByUploadId(uploadId, deviceId);
        return analysis ? toCvAnalysisResponseDto(analysis) : null;
    }
    async getForDevice(deviceId) {
        const cv = await this.cvRepository.findByDeviceId(deviceId);
        if (!cv) {
            throw new AppError('NOT_FOUND', 'مفيش سيرة ذاتية لسه للجهاز ده', { retryable: false });
        }
        const sections = await this.cvRepository.findSectionsByCvId(cv.id);
        return toCvResponseDto(cv, sections);
    }
    async patch(deviceId, dto) {
        const cv = await this.cvRepository.findByDeviceId(deviceId);
        if (!cv) {
            throw new AppError('NOT_FOUND', 'مفيش سيرة ذاتية لسه للجهاز ده', { retryable: false });
        }
        const result = cvPatchSchema.safeParse(dto);
        if (!result.success) {
            throw new AppError('INVALID_REQUEST', 'البيانات اللي بعتها مش صحيحة', { retryable: false });
        }
        const patch = result.data;
        if (patch.name !== undefined) {
            cv.name = patch.name;
        }
        if (patch.title !== undefined) {
            cv.title = patch.title;
        }
        if (patch.contact !== undefined) {
            const { phone, email, location } = patch.contact;
            cv.contact = {
                ...cv.contact,
                ...(phone !== undefined && { phone: phone ?? undefined }),
                ...(email !== undefined && { email: email ?? undefined }),
                ...(location !== undefined && { location: location ?? undefined }),
            };
        }
        if (patch.summary !== undefined) {
            cv.summary = patch.summary;
        }
        if ((patch.name !== undefined || patch.title !== undefined || patch.contact !== undefined) && !cv.confirmedSections.includes('basic')) {
            cv.confirmedSections = [...cv.confirmedSections, 'basic'];
        }
        for (const section of ARRAY_SECTIONS) {
            const content = patch[section];
            if (content === undefined) {
                continue;
            }
            await this.cvRepository.upsertSection(cv.id, section, content);
            if (!cv.confirmedSections.includes(section)) {
                cv.confirmedSections = [...cv.confirmedSections, section];
            }
        }
        await this.cvRepository.saveCv(cv);
        const sections = await this.cvRepository.findSectionsByCvId(cv.id);
        return toCvResponseDto(cv, sections);
    }
};
CvService = __decorate([
    Injectable(),
    __param(2, InjectDataSource()),
    __metadata("design:paramtypes", [CvRepository,
        CvPdfRenderer,
        DataSource])
], CvService);
export { CvService };
//# sourceMappingURL=cv.service.js.map