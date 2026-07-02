import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { GeminiLlmService } from './gemini-llm.service';
import { LLM_SERVICE } from './interfaces/llm.interface';
import { LlmController } from './llm.controller';
import { OpenWeatherProvider } from './providers/openweather.provider';
import { CurrentTimeTool } from './tools/current-time.tool';
import { WeatherTool } from './tools/weather.tool';

@Module({
  imports: [HttpModule],
  controllers: [LlmController],
  providers: [
    {
      provide: LLM_SERVICE,
      useClass: GeminiLlmService,
    },
    CurrentTimeTool,
    OpenWeatherProvider,
    WeatherTool,
  ],
  exports: [LLM_SERVICE, CurrentTimeTool, WeatherTool],
})
export class LlmModule {}
