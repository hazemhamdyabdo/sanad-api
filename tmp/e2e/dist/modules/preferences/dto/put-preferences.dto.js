var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { WORK_TYPES, WORLDWIDE } from '../../../common/types/contract.js';
export class PutPreferencesDto {
    country;
    city;
    workTypes;
    willingToRelocate;
}
__decorate([
    IsString(),
    Matches(new RegExp(`^([A-Z]{2}|${WORLDWIDE})$`)),
    __metadata("design:type", String)
], PutPreferencesDto.prototype, "country", void 0);
__decorate([
    ValidateIf((dto) => dto.city !== null && dto.city !== undefined),
    IsString(),
    Matches(/^[a-z_]+$/),
    __metadata("design:type", Object)
], PutPreferencesDto.prototype, "city", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayUnique(),
    IsIn(WORK_TYPES, { each: true }),
    __metadata("design:type", Array)
], PutPreferencesDto.prototype, "workTypes", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], PutPreferencesDto.prototype, "willingToRelocate", void 0);
//# sourceMappingURL=put-preferences.dto.js.map