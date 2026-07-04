import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';

import { GeminiLlmService } from './gemini-llm.service';
import { LLM_SERVICE } from './interfaces/llm.interface';
import { LlmController } from './llm.controller';
import { McpService } from './mcp.service';
import { OpenWeatherProvider } from './providers/openweather.provider';
import { CurrentTimeTool } from './tools/current-time.tool';
import { MathTool } from './tools/math.tool';
import { StatusTool } from './tools/status.tool';
import { WeatherTool } from './tools/weather.tool';

@Module({
  imports: [
    HttpModule,
    McpModule.forFeature([MathTool, StatusTool], 'KnoziAi MCP Server'),
  ],
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
    StatusTool,
    MathTool,
  ],
  exports: [LLM_SERVICE, CurrentTimeTool, WeatherTool, McpService],
})
export class LlmModule {}
