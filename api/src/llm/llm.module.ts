import { McpModule } from '@nestjs-mcp/server';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { GeminiLlmService } from './gemini-llm.service';
import { LLM_SERVICE } from './interfaces/llm.interface';
import { LlmController } from './llm.controller';
import { McpService } from './mcp.service';
import { OpenWeatherProvider } from './providers/openweather.provider';
import { MathResolver } from './resolvers/math.resolver';
import { StatusResolver } from './resolvers/status.resolver';
import { CurrentTimeTool } from './tools/current-time.tool';
import { WeatherTool } from './tools/weather.tool';

@Module({
  imports: [HttpModule, McpModule.forFeature()],
  controllers: [LlmController],
  providers: [
    {
      provide: LLM_SERVICE,
      useClass: GeminiLlmService,
    },
    CurrentTimeTool,
    OpenWeatherProvider,
    WeatherTool,
    McpService,
    StatusResolver,
    MathResolver,
  ],
  exports: [LLM_SERVICE, CurrentTimeTool, WeatherTool, McpService],
})
export class LlmModule {}
