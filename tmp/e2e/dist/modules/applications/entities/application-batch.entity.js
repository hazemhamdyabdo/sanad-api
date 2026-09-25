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
let ApplicationBatch = class ApplicationBatch {
    id;
    deviceId;
    status;
    applicationIds;
    alreadyAppliedIds;
    createdAt;
    completedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], ApplicationBatch.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], ApplicationBatch.prototype, "deviceId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], ApplicationBatch.prototype, "status", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], ApplicationBatch.prototype, "applicationIds", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], ApplicationBatch.prototype, "alreadyAppliedIds", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ApplicationBatch.prototype, "createdAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ApplicationBatch.prototype, "completedAt", void 0);
ApplicationBatch = __decorate([
    Entity('application_batches')
], ApplicationBatch);
export { ApplicationBatch };
//# sourceMappingURL=application-batch.entity.js.map