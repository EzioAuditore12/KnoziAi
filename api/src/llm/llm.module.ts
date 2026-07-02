import { Global, Module } from '@nestjs/common';

import { PromptModule } from '../prompt/prompt.module';
import { GeminiLlmService } from './gemini-llm.service';
import { LLM_SERVICE } from './interfaces/llm.interface';
import { LlmController } from './llm.controller';
import { CurrentTimeTool } from './tools/current-time.tool';

@Global()
@Module({
  imports: [PromptModule],
  controllers: [LlmController],
  providers: [
    {
      provide: LLM_SERVICE,
      useClass: GeminiLlmService,
    },
    CurrentTimeTool,
  ],
  exports: [LLM_SERVICE, CurrentTimeTool],
})
export class LlmModule {}
