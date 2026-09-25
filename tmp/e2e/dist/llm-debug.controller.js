var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.js';
import { LLM_PROVIDER } from './integrations/llm/llm.interface.js';
let LlmDebugController = class LlmDebugController {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async complete(message) {
        const reply = await this.llm.complete({
            messages: [{ role: 'user', content: message ?? 'قول جملة قصيرة بالمصري للتأكيد إن الاتصال شغال' }],
        });
        return { reply };
    }
    async stream(message, res) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        for await (const chunk of this.llm.stream({
            messages: [{ role: 'user', content: message ?? 'قول جملة قصيرة بالمصري للتأكيد إن الاتصال شغال' }],
        })) {
            res.write(chunk);
        }
        res.end();
    }
};
__decorate([
    Get(),
    Public(),
    __param(0, Query('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LlmDebugController.prototype, "complete", null);
__decorate([
    Get('stream'),
    Public(),
    __param(0, Query('message')),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LlmDebugController.prototype, "stream", null);
LlmDebugController = __decorate([
    Controller('_debug/llm'),
    __param(0, Inject(LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], LlmDebugController);
export { LlmDebugController };
//# sourceMappingURL=llm-debug.controller.js.map