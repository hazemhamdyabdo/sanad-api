var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
let JobPreferences = class JobPreferences {
    deviceId;
    country;
    city;
    workTypes;
    willingToRelocate;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryColumn('uuid'),
    __metadata("design:type", String)
], JobPreferences.prototype, "deviceId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], JobPreferences.prototype, "country", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], JobPreferences.prototype, "city", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], JobPreferences.prototype, "workTypes", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], JobPreferences.prototype, "willingToRelocate", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], JobPreferences.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], JobPreferences.prototype, "updatedAt", void 0);
JobPreferences = __decorate([
    Entity('job_preferences')
], JobPreferences);
export { JobPreferences };
//# sourceMappingURL=job-preferences.entity.js.map