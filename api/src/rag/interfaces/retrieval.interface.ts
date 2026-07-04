import { Model } from 'mongoose';

import { RagStrategy } from '../enums/rag-strategy.enum';

export const RETRIEVAL_SERVICE = 'RETRIEVAL_SERVICE';

export type RetrievedContext = {
  id: string;
  content: string;
  metaData: unknown;
  score: number;
  source: 'vector' | 'keyword' | 'hybrid';
};

export interface RetrievalService {
  embeddingModelName: string;
  outputDimensionality: number;

  generateQueryVariants(query: string, size: number): Promise<string[]>;

  retrieveContext(
    model: Model<any>,
    projectId: string,
    query: string,
    strategy: RagStrategy,
    limit: number,
  ): Promise<RetrievedContext[]>;

  answerFromContext(
    query: string,
    contexts: RetrievedContext[],
  ): Promise<string>;
}
