import { Document } from '@langchain/core/documents';

export const INGESTION_SERVICE = 'INGESTION_SERVICE';

export interface IngestionService {
  embeddingModelName: string;
  outputDimensionality: number;

  processDocuments(filePath: string): Promise<Document[]>;
}
