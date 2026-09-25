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
let Application = class Application {
    id;
    deviceId;
    jobId;
    batchId;
    method;
    status;
    stage;
    jobTitle;
    company;
    location;
    listingUrl;
    recipientEmail;
    tailoredCv;
    cvTailored;
    errorCode;
    errorDetail;
    providerMessageId;
    createdAt;
    updatedAt;
    sentAt;
    preparedAt;
    openedAt;
    failedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], Application.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], Application.prototype, "deviceId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "jobId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Application.prototype, "batchId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Application.prototype, "method", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Application.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "stage", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Application.prototype, "jobTitle", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "company", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "location", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Application.prototype, "listingUrl", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "recipientEmail", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "tailoredCv", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Application.prototype, "cvTailored", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "errorCode", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "errorDetail", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "providerMessageId", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Application.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Application.prototype, "updatedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "sentAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "preparedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "openedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Application.prototype, "failedAt", void 0);
Application = __decorate([
    Entity('applications'),
    Index(['deviceId', 'jobId'], { unique: true })
], Application);
export { Application };
//# sourceMappingURL=application.entity.js.map