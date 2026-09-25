var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsOptional } from 'class-validator';
export class PatchCvDto {
    name;
    title;
    contact;
    summary;
    experience;
    projects;
    education;
    certificates;
    skills;
    languages;
}
__decorate([
    IsOptional(),
    __metadata("design:type", String)
], PatchCvDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], PatchCvDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], PatchCvDto.prototype, "contact", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], PatchCvDto.prototype, "summary", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], PatchCvDto.prototype, "experience", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], PatchCvDto.prototype, "projects", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], PatchCvDto.prototype, "education", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], PatchCvDto.prototype, "certificates", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], PatchCvDto.prototype, "skills", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], PatchCvDto.prototype, "languages", void 0);
//# sourceMappingURL=patch-cv.dto.js.map