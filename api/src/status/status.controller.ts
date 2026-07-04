import { Controller, Get } from '@nestjs/common';

import { StatusService } from './status.service';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('mcp-tools')
  async checkMcpServer() {
    const tools = await this.statusService.getAvailableMcpTools();
    return { status: 'connected', tools };
  }
}
