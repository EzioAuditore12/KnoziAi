import { GoogleGenerativeAIEmbeddings } from '@dakshp1234/langchain-google-genai';
import { TaskType } from '@google/generative-ai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { LLM_SERVICE, type LlmService } from 'src/llm/interfaces/llm.interface';
import { z } from 'zod';

import { RagStrategy } from './enums/rag-strategy.enum';
import {
  RetrievalService,
  RetrievedContext,
} from './interfaces/retrieval.interface';

@Injectable()
export class GeminiRetrievalService implements RetrievalService {
  private readonly retrievalEmbeddingModel: GoogleGenerativeAIEmbeddings;

  public readonly embeddingModelName: string = 'gemini-embedding-001';
  public readonly outputDimensionality: number = 1536;

  constructor(
    private readonly configService: ConfigService,

    @Inject(LLM_SERVICE)
    private readonly llmService: LlmService,
  ) {
    this.retrievalEmbeddingModel = this.initializeModel();
  }

  public async generateQueryVariants(
    query: string,
    size: number,
  ): Promise<string[]> {
    const schema = z.object({
      queries: z
        .array(z.string())
        .describe(
          `List of exactly ${size} short search queries that mean the same thing as the user question.`,
        ),
    });

    const prompt = PromptTemplate.fromTemplate(
      `Generate ${size} short search queries that mean the same thing as the user question.\nQuestion: {query}`,
    );

    const formattedPrompt = await prompt.format({ query });
    const response = await this.llmService.askWithStructuredOutput(
      formattedPrompt,
      schema,
    );

    return [query, ...response.queries].slice(0, size + 1);
  }

  public async retrieveContext(
    model: Model<any>,
    projectId: string,
    query: string,
    strategy: RagStrategy,
    limit: number,
  ): Promise<RetrievedContext[]> {
    switch (strategy) {
      case RagStrategy.HYBRID:
        return await this.hybridSearch(model, projectId, query, limit);
      case RagStrategy.MULTI_QUERY_VECTOR:
        return await this.multiQueryVectorSearch(
          model,
          projectId,
          query,
          limit,
        );
      case RagStrategy.MULTI_QUERY_HYBRID:
        return await this.multiQueryHybridSearch(
          model,
          projectId,
          query,
          limit,
        );
      case RagStrategy.BASIC:
      default:
        return await this.vectorSearch(model, projectId, query, limit);
    }
  }

  public async answerFromContext(
    query: string,
    contexts: RetrievedContext[],
  ): Promise<string> {
    if (!contexts.length) {
      return "I couldn't find any relevant information in the project documents to answer your question.";
    }

    const contextString = contexts
      .map((ctx, index) => `[Context ${index + 1}]:\n${ctx.content}`)
      .join('\n\n');

    const prompt = PromptTemplate.fromTemplate(
      `You are an intelligent assistant. Use the provided context to answer the user's question accurately.
If you cannot answer the question based on the context, say "I don't know based on the provided documents."

Contexts:
{context}

Question: {query}
Answer:`,
    );

    const formattedPrompt = await prompt.format({
      context: contextString,
      query,
    });

    const response = await this.llmService.askWithSystemPrompt({
      query: formattedPrompt,
      system:
        'You are an AI assistant that answers questions accurately based solely on provided context documents.',
    });

    return response.result;
  }

  private initializeModel(): GoogleGenerativeAIEmbeddings {
    const apiKey = this.configService.get('GOOGLE_API_KEY');

    return new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: this.embeddingModelName,
      taskType: TaskType.RETRIEVAL_QUERY,
      outputDimensionality: this.outputDimensionality,
    });
  }

  private async vectorSearch(
    model: Model<any>,
    projectId: string,
    query: string,
    limit: number,
  ): Promise<RetrievedContext[]> {
    const queryEmbedding = await this.retrievalEmbeddingModel.embedQuery(query);

    const rows = await model.aggregate([
      {
        $vectorSearch: {
          index: 'embedding_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
          filter: { projectId: new Types.ObjectId(projectId) },
        },
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return rows.map((row) => ({
      id: row._id.toString(),
      content: row.content,
      metaData: row.metadata,
      score: row.score,
      source: 'vector' as const,
    }));
  }

  private async keywordSearch(
    model: Model<any>,
    projectId: string,
    query: string,
    limit: number,
  ): Promise<RetrievedContext[]> {
    const rows = await model.aggregate([
      {
        $search: {
          index: 'content_fts_search',
          compound: {
            must: [
              {
                text: {
                  query,
                  path: 'content',
                },
              },
            ],
            filter: [
              {
                equals: {
                  path: 'projectId',
                  value: new Types.ObjectId(projectId),
                },
              },
            ],
          },
        },
      },
      {
        $limit: limit,
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' },
        },
      },
    ]);

    return rows.map((row) => ({
      id: row._id.toString(),
      content: row.content,
      metaData: row.metadata,
      score: row.score,
      source: 'keyword' as const,
    }));
  }

  private async hybridSearch(
    model: Model<any>,
    projectId: string,
    query: string,
    limit: number,
  ): Promise<RetrievedContext[]> {
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(model, projectId, query, limit),
      this.keywordSearch(model, projectId, query, limit),
    ]);

    return this.mergeResults(vectorResults, keywordResults, limit, 'hybrid');
  }

  private async multiQueryVectorSearch(
    model: Model<any>,
    projectId: string,
    query: string,
    limit: number,
  ): Promise<RetrievedContext[]> {
    const expandedQueries = await this.generateQueryVariants(query, 3);

    const results = await Promise.all(
      expandedQueries.map((expandedQuery) =>
        this.vectorSearch(model, projectId, expandedQuery, limit),
      ),
    );

    return this.mergeResults(results.flat(), [], limit, 'vector');
  }

  private async multiQueryHybridSearch(
    model: Model<any>,
    projectId: string,
    query: string,
    limit: number,
  ): Promise<RetrievedContext[]> {
    const expandedQueries = await this.generateQueryVariants(query, 3);

    const [vectorSets, keywordSets] = await Promise.all([
      Promise.all(
        expandedQueries.map((expandedQuery) =>
          this.vectorSearch(model, projectId, expandedQuery, limit),
        ),
      ),
      Promise.all(
        expandedQueries.map((expandedQuery) =>
          this.keywordSearch(model, projectId, expandedQuery, limit),
        ),
      ),
    ]);

    return this.mergeResults(
      vectorSets.flat(),
      keywordSets.flat(),
      limit,
      'hybrid',
    );
  }

  private mergeResults(
    vectorResults: RetrievedContext[],
    keywordResults: RetrievedContext[],
    limit: number,
    source: RetrievedContext['source'],
  ): RetrievedContext[] {
    const merged = new Map<string, RetrievedContext>();

    for (const result of [...vectorResults, ...keywordResults]) {
      const existing = merged.get(result.id);

      if (!existing || result.score > existing.score) {
        merged.set(result.id, { ...result, source });
      }
    }

    return [...merged.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }
}
