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
let UnmatchedRoleTitle = class UnmatchedRoleTitle {
    id;
    normalizedTitle;
    exampleTitle;
    count;
    firstSeenAt;
    lastSeenAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], UnmatchedRoleTitle.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column('varchar'),
    __metadata("design:type", String)
], UnmatchedRoleTitle.prototype, "normalizedTitle", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], UnmatchedRoleTitle.prototype, "exampleTitle", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], UnmatchedRoleTitle.prototype, "count", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], UnmatchedRoleTitle.prototype, "firstSeenAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], UnmatchedRoleTitle.prototype, "lastSeenAt", void 0);
UnmatchedRoleTitle = __decorate([
    Entity('unmatched_role_titles')
], UnmatchedRoleTitle);
export { UnmatchedRoleTitle };
//# sourceMappingURL=unmatched-role-title.entity.js.map