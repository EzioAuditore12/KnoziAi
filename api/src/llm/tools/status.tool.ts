import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';

@Injectable()
export class StatusTool {
  @Tool({
    name: 'health_check',
    description: 'Check the health of the MCP server',
  })
  async healthCheck() {
    return {
      content: [{ type: 'text', text: 'OK' }],
    };
  }
}
