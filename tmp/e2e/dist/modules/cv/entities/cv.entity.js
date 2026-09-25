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
let Cv = class Cv {
    id;
    deviceId;
    isComplete;
    confirmedSections;
    name;
    title;
    contact;
    summary;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], Cv.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column('uuid'),
    __metadata("design:type", String)
], Cv.prototype, "deviceId", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Cv.prototype, "isComplete", void 0);
__decorate([
    Column({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], Cv.prototype, "confirmedSections", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Cv.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Cv.prototype, "title", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Cv.prototype, "contact", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Cv.prototype, "summary", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Cv.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Cv.prototype, "updatedAt", void 0);
Cv = __decorate([
    Entity('cvs')
], Cv);
export { Cv };
//# sourceMappingURL=cv.entity.js.map