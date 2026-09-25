var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
let CvSection = class CvSection {
    id;
    cvId;
    section;
    content;
    confirmedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], CvSection.prototype, "id", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], CvSection.prototype, "cvId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], CvSection.prototype, "section", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], CvSection.prototype, "content", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CvSection.prototype, "confirmedAt", void 0);
CvSection = __decorate([
    Entity('cv_sections'),
    Index(['cvId', 'section'], { unique: true })
], CvSection);
export { CvSection };
//# sourceMappingURL=cv-section.entity.js.map