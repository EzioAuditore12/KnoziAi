import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnstructuredClient } from 'unstructured-client';

@Injectable()
export class UnstructuredService {
  private readonly unstructuredClient: UnstructuredClient;

  constructor(private readonly configService: ConfigService) {
    this.unstructuredClient = this.initializeClient();
  }

  private initializeClient(): UnstructuredClient {
    const apiEndpoint = this.configService.get('UNSTRUCTURED_API_ENDPOINT');
    const apiKey = this.configService.get('UNSTRUCTURED_API_KEY');

    return new UnstructuredClient({
      serverURL: apiEndpoint,
      security: {
        apiKeyAuth: apiKey,
      },
    });
  }
}
