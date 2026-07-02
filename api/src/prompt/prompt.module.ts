import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';

import { PromptController } from './prompt.controller';
import { PromptService } from './prompt.service';

@Module({
  imports: [LlmModule],
  controllers: [PromptController],
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}
