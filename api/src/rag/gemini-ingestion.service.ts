import fs from 'node:fs';
import zlib from 'node:zlib';
import { GoogleGenerativeAIEmbeddings } from '@dakshp1234/langchain-google-genai';
import { TaskType } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';
import { HumanMessage } from '@langchain/core/messages';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'nestjs-cloudinary';
import { LLM_SERVICE, type LlmService } from 'src/llm/interfaces/llm.interface';

import { IngestionService } from './interfaces/ingestion.interface';
import {
  Chunk,
  ContentData,
  EmbeddingMetaData,
} from './types/unstructured-types';
import { UnstructuredService } from './unstructured.service';

@Injectable()
export class GeminiIngestionService implements IngestionService {
  private readonly logger = new Logger(GeminiIngestionService.name);
  private readonly documentEmbeddingModel: GoogleGenerativeAIEmbeddings;
  private readonly tempImageDir = './.public';

  constructor(
    private readonly configService: ConfigService,

    private readonly unstructuredService: UnstructuredService,

    @Inject(LLM_SERVICE)
    private readonly llmService: LlmService,

    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.documentEmbeddingModel = this.initializeModel();
  }

  public async processDocuments(filePath: string): Promise<Document[]> {
    const chunks =
      await this.unstructuredService.partitianDocumentAndSplitInChunksByTitle(
        filePath,
      );

    const documents = await this.summarizeChunks(chunks);

    return documents;
  }

  private async summarizeChunks(chunks: Chunk[]): Promise<Document[]> {
    this.logger.log('🧠 Processing chunks with AI Summaries...');

    const langchainDocuments: Document[] = [];

    const totalChunks = chunks.length;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i];
      const currentChunk = i + 1;
      const progressMsg = `Processing chunk ${currentChunk}/${totalChunks}`;

      this.logger.log(`   ${progressMsg}`);

      // Analyze chunk content
      const contentData = await this.separateContentTypes(chunk);

      // Debug prints
      this.logger.log(`     Types found: ${contentData.types}`);
      this.logger.log(
        `     Tables: ${contentData.tables.length}, Images: ${contentData.images.length}, LLM images: ${contentData.imageDataUrls.length}`,
      );

      let enhancedContent: string;
      // Create AI-enhanced summary if chunk has tables/images
      if (
        contentData.tables.length > 0 ||
        contentData.imageDataUrls.length > 0
      ) {
        this.logger.log(`     → Creating AI summary for mixed content...`);
        try {
          enhancedContent = (await this.createAiEnhancedSummary(
            contentData.text,
            contentData.tables,
            contentData.imageDataUrls,
          )) as string;
          this.logger.log(`     → AI summary created successfully`);
          this.logger.log(
            `     → Enhanced content preview: ${enhancedContent.slice(0, 200)}...`,
          );
        } catch (e) {
          this.logger.error(`     ❌ AI summary failed: ${e}`);
          enhancedContent = contentData.text;
        }
      } else {
        this.logger.log(`     → Using raw text (no tables/images)`);
        enhancedContent = contentData.text;
      }

      // Create LangChain Document with rich metadata
      langchainDocuments.push(
        new Document({
          pageContent: enhancedContent,
          metadata: this.buildEmbeddingMetaData(contentData),
        }),
      );
    }

    const texts = langchainDocuments.map((doc) => doc.pageContent);
    const embeddings = await this.documentEmbeddingModel.embedDocuments(texts);

    langchainDocuments.forEach((doc, idx) => {
      doc.metadata.embedding = embeddings[idx];
    });

    return langchainDocuments;
  }

  private async separateContentTypes(chunk: Chunk): Promise<ContentData> {
    const contentData: ContentData = {
      text: chunk.text,
      tables: [],
      images: [],
      imageDataUrls: [],
      types: ['text'],
    };

    if (chunk.metadata?.orig_elements) {
      let origElements = chunk.metadata.orig_elements;

      // Handle base64-zlib encoded string
      if (typeof origElements === 'string') {
        const buffer = Buffer.from(origElements, 'base64');
        const decompressed = zlib.inflateSync(buffer).toString('utf-8');
        origElements = JSON.parse(decompressed);
      }

      for (const element of origElements) {
        const elementType = element?.type || element?.constructor?.name;

        if (elementType === 'Table') {
          contentData.types.push('table');
          const tableHtml = element?.metadata?.text_as_html || element.text;
          contentData.tables.push(tableHtml);
        } else if (elementType === 'Image') {
          if (element?.metadata?.image_base64) {
            contentData.types.push('image');
            try {
              const base64Data = element.metadata.image_base64;
              const imageDataUrl = base64Data.startsWith('data:')
                ? base64Data
                : `data:image/jpeg;base64,${base64Data}`;

              contentData.imageDataUrls.push(imageDataUrl);

              const rawBase64 = imageDataUrl.includes(',')
                ? imageDataUrl.split(',')[1]
                : base64Data;
              const buffer = Buffer.from(rawBase64, 'base64');
              const tempPath = `${this.tempImageDir}/image-${crypto.randomUUID()}.jpg`;

              if (!fs.existsSync(this.tempImageDir)) {
                fs.mkdirSync(this.tempImageDir, { recursive: true });
              }
              fs.writeFileSync(tempPath, buffer);
              const uploadResult =
                await this.cloudinaryService.cloudinaryInstance.uploader.upload(
                  tempPath,
                  { public_id: `rag-image-${Date.now()}` },
                );
              contentData.images.push(uploadResult.secure_url);

              // Clean up temp file
              fs.unlinkSync(tempPath);
            } catch (error) {
              this.logger.error(
                `     ❌ Failed to upload image to Cloudinary: ${error}`,
              );
            }
          }
        }
      }
    }

    contentData.types = Array.from(new Set(contentData.types));

    return contentData;
  }

  private buildEmbeddingMetaData(contentData: ContentData): EmbeddingMetaData {
    return {
      text: contentData.text,
      tables: contentData.tables,
      images: contentData.images,
    };
  }

  private async createAiEnhancedSummary(
    text: string,
    tables: string[],
    images: string[],
  ) {
    let promptText = `You are creating a searchable description for document content retrieval.

        CONTENT TO ANALYZE:
        TEXT CONTENT:
        ${text}
        `;

    if (tables && tables.length > 0) {
      promptText += 'TABLES:\n';
      tables.forEach((table, i) => {
        promptText += `Table ${i + 1}:\n${table}\n\n`;
      });
    }

    promptText += `
    YOUR TASK:
    Generate a comprehensive, searchable description that covers:

        1. Key facts, numbers, and data points from text and tables
        2. Main topics and concepts discussed  
        3. Questions this content could answer
        4. Visual content analysis (charts, diagrams, patterns in images)
        5. Alternative search terms users might use

        Make it detailed and searchable - prioritize findability over brevity.

        SEARCHABLE DESCRIPTION:`;

    // Build message content for LLM
    const messageContent: any[] = [{ type: 'text', text: promptText }];

    for (const imageUrl of images) {
      messageContent.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    try {
      const response = await this.llmService.askWithContext([
        new HumanMessage({ content: messageContent }),
      ]);
      return response;
    } catch (e) {
      this.logger.error(`     ❌ AI summary failed: ${e}`);
      // Fallback to simple summary
      let summary = text.slice(0, 300) + '...';
      if (tables.length) summary += ` [Contains ${tables.length} table(s)]`;
      if (images.length) summary += ` [Contains ${images.length} image(s)]`;
      return summary;
    }
  }

  private initializeModel(): GoogleGenerativeAIEmbeddings {
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    const embeddingModelName = 'gemini-embedding-001';
    const outputDimensionality = 1536;

    return new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: embeddingModelName,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      outputDimensionality,
    });
  }
}
