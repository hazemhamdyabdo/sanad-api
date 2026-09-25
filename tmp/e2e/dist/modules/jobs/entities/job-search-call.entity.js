var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
let JobSearchCall = class JobSearchCall {
    id;
    provider;
    keywords;
    location;
    page;
    succeeded;
    jobsReturned;
    totalCount;
    errorMessage;
    requestedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], JobSearchCall.prototype, "id", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], JobSearchCall.prototype, "provider", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], JobSearchCall.prototype, "keywords", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], JobSearchCall.prototype, "location", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], JobSearchCall.prototype, "page", void 0);
__decorate([
    Column('boolean'),
    __metadata("design:type", Boolean)
], JobSearchCall.prototype, "succeeded", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], JobSearchCall.prototype, "jobsReturned", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], JobSearchCall.prototype, "totalCount", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], JobSearchCall.prototype, "errorMessage", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], JobSearchCall.prototype, "requestedAt", void 0);
JobSearchCall = __decorate([
    Entity('job_search_calls')
], JobSearchCall);
export { JobSearchCall };
//# sourceMappingURL=job-search-call.entity.js.map