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
let RoleIngestionCache = class RoleIngestionCache {
    id;
    group;
    country;
    status;
    lastFetchedAt;
    lastError;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryColumn('varchar'),
    __metadata("design:type", String)
], RoleIngestionCache.prototype, "id", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], RoleIngestionCache.prototype, "group", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], RoleIngestionCache.prototype, "country", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], RoleIngestionCache.prototype, "status", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], RoleIngestionCache.prototype, "lastFetchedAt", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RoleIngestionCache.prototype, "lastError", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], RoleIngestionCache.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], RoleIngestionCache.prototype, "updatedAt", void 0);
RoleIngestionCache = __decorate([
    Entity('role_ingestion_cache'),
    Index(['group', 'country'], { unique: true })
], RoleIngestionCache);
export { RoleIngestionCache };
//# sourceMappingURL=role-ingestion-cache.entity.js.map