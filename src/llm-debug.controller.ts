import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from './common/decorators/public.decorator.js';
import { LLM_PROVIDER, type LlmProvider } from './integrations/llm/llm.interface.js';

/**
 * TEMPORARY — verifies the configured LLM provider end to end. Delete this
 * file and its registration in app.module.ts once verified; it isn't part
 * of the real API surface.
 */
@Controller('_debug/llm')
export class LlmDebugController {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  @Get()
  @Public()
  async complete(@Query('message') message?: string): Promise<{ reply: string }> {
    const reply = await this.llm.complete({
      messages: [{ role: 'user', content: message ?? 'قول جملة قصيرة بالمصري للتأكيد إن الاتصال شغال' }],
    });
    return { reply };
  }

  @Get('stream')
  @Public()
  async stream(@Query('message') message: string | undefined, @Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    for await (const chunk of this.llm.stream({
      messages: [{ role: 'user', content: message ?? 'قول جملة قصيرة بالمصري للتأكيد إن الاتصال شغال' }],
    })) {
      res.write(chunk);
    }
    res.end();
  }
}
