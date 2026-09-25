var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsIn, IsInt, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { MESSAGE_SOURCES } from '../../../common/types/contract.js';
export class SendMessageDto {
    text;
    source;
    audioDurationSec;
}
__decorate([
    IsString(),
    MinLength(1),
    __metadata("design:type", String)
], SendMessageDto.prototype, "text", void 0);
__decorate([
    IsIn(MESSAGE_SOURCES),
    __metadata("design:type", String)
], SendMessageDto.prototype, "source", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    IsPositive(),
    __metadata("design:type", Number)
], SendMessageDto.prototype, "audioDurationSec", void 0);
//# sourceMappingURL=send-message.dto.js.map