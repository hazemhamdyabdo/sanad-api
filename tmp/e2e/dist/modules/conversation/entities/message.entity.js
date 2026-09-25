var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Generated, Index, PrimaryColumn } from 'typeorm';
let Message = class Message {
    id;
    sessionId;
    role;
    section;
    type;
    text;
    card;
    quickReplies;
    source;
    audioDurationSec;
    sequence;
    createdAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Message.prototype, "sessionId", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Message.prototype, "role", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "section", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], Message.prototype, "type", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "text", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "card", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "quickReplies", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "source", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "audioDurationSec", void 0);
__decorate([
    Generated('increment'),
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], Message.prototype, "sequence", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
Message = __decorate([
    Entity('messages'),
    Index(['sessionId', 'sequence'])
], Message);
export { Message };
//# sourceMappingURL=message.entity.js.map