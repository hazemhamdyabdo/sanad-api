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
let Upload = class Upload {
    id;
    deviceId;
    status;
    currentStage;
    filePath;
    originalFileName;
    mimeType;
    error;
    createdAt;
    expiresAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], Upload.prototype, "id", void 0);
__decorate([
    Index(),
    Column('uuid'),
    __metadata("design:type", String)
], Upload.prototype, "deviceId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Upload.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Upload.prototype, "currentStage", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Upload.prototype, "filePath", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Upload.prototype, "originalFileName", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Upload.prototype, "mimeType", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Upload.prototype, "error", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Upload.prototype, "createdAt", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Upload.prototype, "expiresAt", void 0);
Upload = __decorate([
    Entity('uploads')
], Upload);
export { Upload };
//# sourceMappingURL=upload.entity.js.map