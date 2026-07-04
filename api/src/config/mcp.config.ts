import { registerAs } from '@nestjs/config';
import { McpOptions, McpTransportType } from '@rekog/mcp-nest';

export const MCP_CONFIG_NAME = 'mcp';

export default registerAs(MCP_CONFIG_NAME, (): McpOptions => ({
  name: 'KnoziAi MCP Server',
  version: '1.0.0',
  transport: McpTransportType.SSE,
}));
