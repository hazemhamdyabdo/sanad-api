var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
let JobMatchExplanationRow = class JobMatchExplanationRow {
    id;
    deviceId;
    jobId;
    profileHash;
    match;
    whyMatch;
    gaps;
    createdAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], JobMatchExplanationRow.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], JobMatchExplanationRow.prototype, "deviceId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], JobMatchExplanationRow.prototype, "jobId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], JobMatchExplanationRow.prototype, "profileHash", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], JobMatchExplanationRow.prototype, "match", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], JobMatchExplanationRow.prototype, "whyMatch", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], JobMatchExplanationRow.prototype, "gaps", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], JobMatchExplanationRow.prototype, "createdAt", void 0);
JobMatchExplanationRow = __decorate([
    Entity('job_match_explanations'),
    Index(['deviceId', 'jobId'], { unique: true })
], JobMatchExplanationRow);
export { JobMatchExplanationRow };
//# sourceMappingURL=job-match-explanation.entity.js.map