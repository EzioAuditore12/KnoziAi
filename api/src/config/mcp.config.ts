import { McpModuleOptions } from '@nestjs-mcp/server';
import { registerAs } from '@nestjs/config';

export const MCP_CONFIG_NAME = 'mcp';

export default registerAs(MCP_CONFIG_NAME, (): McpModuleOptions => ({
  name: 'KnoziAi MCP Server',
  version: '1.0.0',
  transports: {
    streamable: {
      enabled: true,
    },
    sse: {
      enabled: true,
    },
  },
}));
