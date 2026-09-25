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
let Job = class Job {
    id;
    provider;
    externalId;
    role;
    group;
    country;
    title;
    company;
    location;
    snippet;
    salary;
    jobType;
    link;
    applyMethod;
    applyEmail;
    sourceUpdatedAt;
    workType;
    employmentType;
    city;
    raw;
    firstSeenAt;
    lastSeenAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], Job.prototype, "id", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "provider", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "externalId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "role", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "group", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "country", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "title", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "company", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "location", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "snippet", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "salary", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "jobType", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "link", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Job.prototype, "applyMethod", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "applyEmail", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "sourceUpdatedAt", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "workType", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "employmentType", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Job.prototype, "city", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Job.prototype, "raw", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Job.prototype, "firstSeenAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Job.prototype, "lastSeenAt", void 0);
Job = __decorate([
    Entity('jobs'),
    Index(['provider', 'externalId'], { unique: true })
], Job);
export { Job };
//# sourceMappingURL=job.entity.js.map