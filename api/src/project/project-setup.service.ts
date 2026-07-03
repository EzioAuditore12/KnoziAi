import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ProjectFileEmbedding } from './entities/project-file-embedding.entity';

@Injectable()
export class ProjectSetupService implements OnModuleInit {
  private readonly logger = new Logger(ProjectSetupService.name);

  constructor(
    @InjectModel(ProjectFileEmbedding.name)
    private readonly embeddingModel: Model<ProjectFileEmbedding>,
  ) {}

  async onModuleInit() {
    await this.setupVectorSearchIndex();
    await this.setupFullTextSearchIndex();
  }

  private async setupVectorSearchIndex() {
    try {
      // Access the native MongoDB collection
      const collection = this.embeddingModel.collection;

      // Equivalent to your Postgres HNSW + Cosine index
      await collection.createSearchIndex({
        name: 'embedding_index',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 1536, // Make sure this matches your Gemini output dims!
              similarity: 'cosine',
            },
          ],
        },
      });
      this.logger.log('Atlas Vector Search index created/verified');
    } catch (error) {
      // Atlas will throw an error if the index already exists, which is fine
      if (!error.message.includes('already exists')) {
        this.logger.error('Failed to create Vector Search index', error);
      }
    }
  }

  private async setupFullTextSearchIndex() {
    try {
      const collection = this.embeddingModel.collection;

      // Equivalent to your Postgres GIN text search index
      await collection.createSearchIndex({
        name: 'content_fts_search',
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              content: { type: 'string' },
              metadata: {
                type: 'document',
                fields: {
                  text: { type: 'string' },
                },
              },
            },
          },
        },
      });
      this.logger.log('Atlas Full Text Search index created/verified');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        this.logger.error('Failed to create Full Text Search index', error);
      }
    }
  }
}
