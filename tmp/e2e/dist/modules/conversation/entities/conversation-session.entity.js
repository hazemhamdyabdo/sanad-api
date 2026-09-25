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
let ConversationSession = class ConversationSession {
    id;
    deviceId;
    mode;
    status;
    currentSection;
    sections;
    uploadId;
    cvId;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], ConversationSession.prototype, "id", void 0);
__decorate([
    Index(),
    Column('uuid'),
    __metadata("design:type", String)
], ConversationSession.prototype, "deviceId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], ConversationSession.prototype, "mode", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], ConversationSession.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ConversationSession.prototype, "currentSection", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], ConversationSession.prototype, "sections", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ConversationSession.prototype, "uploadId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ConversationSession.prototype, "cvId", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ConversationSession.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ConversationSession.prototype, "updatedAt", void 0);
ConversationSession = __decorate([
    Entity('conversation_sessions')
], ConversationSession);
export { ConversationSession };
//# sourceMappingURL=conversation-session.entity.js.map