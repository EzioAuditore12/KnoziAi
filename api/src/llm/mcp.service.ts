import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamicStructuredTool } from '@langchain/core/tools';

@Injectable()
export class McpService implements OnModuleDestroy {
  private readonly logger = new Logger(McpService.name);
  private readonly mcpClient: MultiServerMCPClient;

  constructor(private readonly configService: ConfigService) {
    this.mcpClient = this.initializeClient();
  }

  public async getMcpTools(): Promise<DynamicStructuredTool[]> {
    try {
      // Ensure the connections are established (will lazy connect if the server is up)
      await this.mcpClient.initializeConnections();
      return await this.mcpClient.getTools();
    } catch (error) {
      this.logger.warn(
        `Could not fetch MCP tools (the server might not be ready yet): ${error instanceof Error ? error.message : String(error)}`,
      );
      return []; // return empty array if it fails so it doesn't crash the LLM flow
    }
  }

  async onModuleDestroy() {
    await this.mcpClient.close();
  }

  private initializeClient(): MultiServerMCPClient {
    const PORT = this.configService.get('PORT')!;
    const serverUrl = `http://localhost:${PORT}/sse`;

    return new MultiServerMCPClient({
      localNestServer: {
        transport: 'sse',
        url: serverUrl,
      },
    });
  }
}
