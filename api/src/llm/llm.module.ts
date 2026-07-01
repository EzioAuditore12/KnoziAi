import { Global, Module } from '@nestjs/common';

import { GeminiLlmService } from './gemini-llm.service';
import { LLM_SERVICE } from './interfaces/llm.interface';
import { LlmController } from './llm.controller';

@Global()
@Module({
  controllers: [LlmController],
  providers: [
    {
      provide: LLM_SERVICE,
      useClass: GeminiLlmService,
    },
  ],
  exports: [LLM_SERVICE],
})
export class LlmModule {}
