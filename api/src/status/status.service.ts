import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StatusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatusService.name);
  private readonly mcpClient: MultiServerMCPClient;

  constructor(private readonly configService: ConfigService) {
    this.mcpClient = this.initializeClient();
  }

  async onModuleInit() {
    try {
      // Initialize connections to the defined MCP servers
      await this.mcpClient.initializeConnections();

      // Test that the connection works by fetching available tools!
      const tools = await this.mcpClient.getTools();
      this.logger.log(
        `Available MCP Tools in LangChain: ${tools.map((t) => t.name).join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize MCP connections: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.warn(
        'The local MCP server might not be listening yet. Connection will be established when tools are requested.',
      );
    }
  }

  public async getAvailableMcpTools() {
    await this.mcpClient.initializeConnections();
    const tools = await this.mcpClient.getTools();
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  async onModuleDestroy() {
    await this.mcpClient.close();
  }

  private initializeClient(): MultiServerMCPClient {
    // The @nestjs-mcp/server SSE endpoints are at /sse by default

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
