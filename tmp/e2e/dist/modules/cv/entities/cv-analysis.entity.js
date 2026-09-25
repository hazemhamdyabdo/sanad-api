var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
let CvAnalysis = class CvAnalysis {
    id;
    deviceId;
    uploadId;
    cv;
    sectionConfidence;
    seniority;
    yearsOfExperience;
    skills;
    domains;
    strengths;
    gaps;
    qualityIssues;
    overallScore;
    scoreReason;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], CvAnalysis.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column('uuid'),
    __metadata("design:type", String)
], CvAnalysis.prototype, "deviceId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], CvAnalysis.prototype, "uploadId", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], CvAnalysis.prototype, "cv", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], CvAnalysis.prototype, "sectionConfidence", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], CvAnalysis.prototype, "seniority", void 0);
__decorate([
    Column({ type: 'real', nullable: true }),
    __metadata("design:type", Object)
], CvAnalysis.prototype, "yearsOfExperience", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], CvAnalysis.prototype, "skills", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], CvAnalysis.prototype, "domains", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], CvAnalysis.prototype, "strengths", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], CvAnalysis.prototype, "gaps", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], CvAnalysis.prototype, "qualityIssues", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], CvAnalysis.prototype, "overallScore", void 0);
__decorate([
    Column('text'),
    __metadata("design:type", String)
], CvAnalysis.prototype, "scoreReason", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CvAnalysis.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CvAnalysis.prototype, "updatedAt", void 0);
CvAnalysis = __decorate([
    Entity('cv_analyses')
], CvAnalysis);
export { CvAnalysis };
//# sourceMappingURL=cv-analysis.entity.js.map