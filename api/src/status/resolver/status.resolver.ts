import type { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { McpModule, Resolver, Tool } from '@nestjs-mcp/server';

@Resolver('status')
export class StatusResolver {
  @Tool({ name: 'health_check' })
  healthCheck(): CallToolResult {
    return { content: [{ type: 'text', text: 'OK' }] };
  }
}
