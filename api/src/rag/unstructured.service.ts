import fs from 'node:fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnstructuredClient } from 'unstructured-client';
import { Strategy } from 'unstructured-client/sdk/models/shared';

import { ChunkingStrategy } from './enums/chunking-stratergy.enum';
import type { Chunk } from './types/unstructured-types';

@Injectable()
export class UnstructuredService {
  private readonly unstructuredClient: UnstructuredClient;

  constructor(private readonly configService: ConfigService) {
    this.unstructuredClient = this.initializeClient();
  }

  public async partitianDocumentAndSplitInChunksByTitle(
    filePath: string,
  ): Promise<Chunk[]> {
    const data = fs.readFileSync(filePath);

    try {
      const response = await this.unstructuredClient.general.partition({
        partitionParameters: {
          files: {
            content: data,
            fileName: filePath,
          },
          strategy: Strategy.HiRes,
          extractImageBlockTypes: ['Image'],
          pdfInferTableStructure: true,
          includeOrigElements: true,
          chunkingStrategy: ChunkingStrategy.ByTitle,
          maxCharacters: 3000,
          newAfterNChars: 2400,
          combineUnderNChars: 500,
        },
      });

      return response as Chunk[];
    } catch (error) {
      console.error(error);
      throw new Error('Unable to process the document using unstructured');
    }
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
