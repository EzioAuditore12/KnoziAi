import { Document } from '@langchain/core/documents';

export const INGESTION_SERVICE = 'INGESTION_SERVICE';

export interface IngestionService {
  processDocuments(filePath: string): Promise<Document[]>;
}
