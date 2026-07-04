import { McpModule } from '@nestjs-mcp/server';
import { Module } from '@nestjs/common';

import { MathResolver } from './resolver/math.resolver';
import { StatusResolver } from './resolver/status.resolver';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

@Module({
  imports: [McpModule.forFeature()],
  controllers: [StatusController],
  providers: [StatusService, StatusResolver, MathResolver],
})
export class StatusModule {}
