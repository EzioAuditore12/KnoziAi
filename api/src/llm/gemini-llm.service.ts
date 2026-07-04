import { readFile } from 'node:fs/promises';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { InMemoryCache } from '@langchain/core/caches';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolCall,
  ToolMessage,
} from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
import { DynamicTool, StructuredTool } from '@langchain/core/tools';
import { ChatGoogle } from '@langchain/google';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import { AskWithSystemPromptDto } from './dto/ask-with-system-prompt.dto';
import {
  AskWithSystemResponseDto,
  askWithSystemResponseSchema,
} from './dto/ask-with-system-response.dto';
import { LlmService } from './interfaces/llm.interface';
import { McpService } from './mcp.service';
import { CurrentTimeTool } from './tools/current-time.tool';
import { WeatherTool } from './tools/weather.tool';

@Injectable()
export class GeminiLlmService implements LlmService {
  private readonly logger = new Logger(GeminiLlmService.name);
  private model: ChatGoogle;
  private memoryCache = new InMemoryCache();

  constructor(
    private readonly configService: ConfigService,
    private readonly currentTimeTool: CurrentTimeTool,
    private readonly weatherTool: WeatherTool,
    private readonly mcpService: McpService,
  ) {
    this.model = this.initializeModel();
  }

  public async ask(question: string): Promise<string> {
    return this.invokeAndExtract(question);
  }

  public async askWithCache(
    question: string,
    bypassCache: boolean = false,
  ): Promise<any> {
    const startTime = Date.now();
    let response;

    if (bypassCache) {
      // Create a model without the cache to force a fresh request
      const freshModel = new ChatGoogle({
        apiKey: this.configService.get<string>('GOOGLE_API_KEY')!,
        model: this.configService.get<string>('GOOGLE_GEMINI_MODEL_ONE')!,
      });
      response = await freshModel.invoke([new HumanMessage(question)]);
    } else {
      // Use the model with the in-memory cache
      const cachedModel = new ChatGoogle({
        apiKey: this.configService.get<string>('GOOGLE_API_KEY')!,
        model: this.configService.get<string>('GOOGLE_GEMINI_MODEL_ONE')!,
        cache: this.memoryCache,
      });
      response = await cachedModel.invoke([new HumanMessage(question)]);
    }

    const latencyMs = Date.now() - startTime;

    return {
      content: response.content,
      latencyMs,
      // If it resolved extremely fast (under 100ms) and wasn't bypassed, it's highly likely a cache hit.
      isCached: !bypassCache && latencyMs < 100,
    };
  }

  public clearCache(): void {
    // Reinstantiate the memory cache to clear it
    this.memoryCache = new InMemoryCache();
  }

  public async askWithImage(
    question: string,
    imagePath: string,
    mimeType: string,
  ): Promise<any> {
    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const message = new HumanMessage({
      content: [
        { type: 'text', text: question },
        {
          type: 'image_url',
          image_url: `data:${mimeType};base64,${base64Image}`,
        },
      ],
    });

    const response = await this.model.invoke([message]);
    return {
      content: response.content,
      response_metadata: response.response_metadata,
      additional_kwargs: response.additional_kwargs,
    };
  }

  public async askWithLargeFile(
    question: string,
    filePath: string,
    mimeType: string,
    displayName?: string,
  ): Promise<any> {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('Google API Key is not configured');
    }

    const fileManager = new GoogleAIFileManager(apiKey);
    this.logger.log(`Uploading large file to Google File API: ${filePath}`);

    // Upload the file to Google's servers
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName,
    });

    let file = uploadResult.file;
    this.logger.log(`File uploaded successfully. URI: ${file.uri}`);

    // Google takes time to process massive files (especially videos). We must wait until it's ACTIVE.
    while (file.state === 'PROCESSING') {
      this.logger.log(
        `File is still processing... waiting 5 seconds. (Current state: ${file.state})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      file = await fileManager.getFile(file.name);
      if (file.state === 'FAILED') {
        throw new Error('File processing failed on Google servers.');
      }
    }
    this.logger.log(`File is now ACTIVE and ready for queries!`);

    const fileUri = file.uri;

    // Create the message with the file URI and the exact mimeType
    const message = new HumanMessage({
      content: [
        { type: 'text', text: question },
        {
          type: 'media',
          mimeType: mimeType,
          fileUri: fileUri,
        } as any,
      ],
    });

    const response = await this.model.invoke([message]);

    // Optional: We could delete the file using fileManager.deleteFile(uploadResult.file.name)
    // if we don't want it to persist, but for caching purposes, users usually keep it.

    return {
      content: response.content,
      fileUri: fileUri,
      response_metadata: response.response_metadata,
      additional_kwargs: response.additional_kwargs,
    };
  }

  public async askWithPdf(
    question: string,
    pdfPath: string,
    mimeType: string,
  ): Promise<any> {
    const pdfBuffer = await readFile(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');

    const message = new HumanMessage({
      content: [
        { type: 'text', text: question },
        {
          type: 'media',
          mimeType,
          data: base64Pdf,
        } as any, // Using 'media' type as it's the standard for non-image files in newer langchain, fallback to any if type is strict
      ],
    });

    const systemPrompt = new SystemMessage(
      'You are a helpful assistant analyzing a document. Whenever you answer a question based on the document, you must provide citations including exact quotes and the relevant page numbers or section headings where the information was found.',
    );

    // Alternatively, if 'media' is not supported, we can fallback to image_url which often works as a generic inlineData wrapper.
    // Let's use image_url for maximum compatibility with the existing code structure unless it fails.
    const fallbackMessage = new HumanMessage({
      content: [
        { type: 'text', text: question },
        {
          type: 'image_url',
          image_url: `data:${mimeType};base64,${base64Pdf}`,
        },
      ],
    });

    try {
      const response = await this.model.invoke([systemPrompt, fallbackMessage]);
      return {
        content: response.content,
        response_metadata: response.response_metadata,
        additional_kwargs: response.additional_kwargs,
      };
    } catch (e) {
      // fallback to media if image_url throws
      const response = await this.model.invoke([systemPrompt, message]);
      return {
        content: response.content,
        response_metadata: response.response_metadata,
        additional_kwargs: response.additional_kwargs,
      };
    }
  }

  public async askWithThinking(question: string): Promise<any> {
    const response = await this.model.invoke([new HumanMessage(question)], {
      thinkingConfig: {
        includeThoughts: true,
      },
    });

    return {
      content: response.content,
      response_metadata: response.response_metadata,
      additional_kwargs: response.additional_kwargs,
    };
  }

  public async askWithContext(messages: BaseMessage[]): Promise<string> {
    return this.invokeAndExtract(messages);
  }

  public async *askUsingStream(
    question: string,
  ): AsyncGenerator<string, void, unknown> {
    yield* this.streamSimpleChunks(await this.model.stream(question));
  }

  public async *askWithContextUsingStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, void, unknown> {
    yield* this.streamSimpleChunks(await this.model.stream(messages));
  }

  public async askWithSystemPrompt(
    askWithSystemPromptDto: AskWithSystemPromptDto,
  ): Promise<AskWithSystemResponseDto> {
    const { system, query } = askWithSystemPromptDto;
    const structuredLlm = this.model.withStructuredOutput(
      askWithSystemResponseSchema,
    );
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', '{system}'],
      ['human', '{query}'],
    ]);

    const chain = prompt.pipe(structuredLlm);
    return await chain.invoke({ system, query });
  }

  public async askWithStructuredOutput<T>(
    promptText: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const structuredLlm = this.model.withStructuredOutput(schema);
    const prompt = ChatPromptTemplate.fromMessages([['human', '{query}']]);
    const chain = prompt.pipe(structuredLlm);

    return (await chain.invoke({ query: promptText })) as T;
  }

  public async askWithCurrentDateTime(question: string): Promise<string> {
    return this.invokeWithToolsAndHandle(question, [
      this.currentTimeTool.get(),
    ]);
  }

  public async askWithWeather(question: string): Promise<string> {
    return this.invokeWithToolsAndHandle(question, [this.weatherTool.get()]);
  }

  public async askWithMcp(question: string): Promise<string> {
    const mcpTools = await this.mcpService.getMcpTools();
    return this.invokeWithToolsAndHandle(question, mcpTools);
  }

  public async askWithCodeExecution(question: string): Promise<string> {
    return this.invokeWithToolsAndHandle(question, [{ codeExecution: {} }]);
  }

  public async askWithWebSearch(question: string): Promise<string> {
    const modelWithTools = this.model.bindTools([{ googleSearch: {} }]);
    const response = await modelWithTools.invoke([new HumanMessage(question)]);
    return this.extractText(response.content);
  }

  public async *askWithWebSearchStream(
    question: string,
  ): AsyncGenerator<string, void, unknown> {
    const modelWithTools = this.model.bindTools([{ googleSearch: {} }]);
    yield* this.streamComplexChunks(
      await modelWithTools.stream([new HumanMessage(question)]),
    );
  }

  public async *askWithCodeExecutionStream(
    question: string,
  ): AsyncGenerator<string, void, unknown> {
    const modelWithTools = this.model.bindTools([{ codeExecution: {} }]);
    yield* this.streamComplexChunks(
      await modelWithTools.stream([new HumanMessage(question)]),
    );
  }

  public async *askWithToolsAndContextStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, BaseMessage[], unknown> {
    const mcpTools = await this.mcpService.getMcpTools();
    const allTools = [
      this.currentTimeTool.get(),
      this.weatherTool.get(),
      ...mcpTools,
    ];
    const modelWithTools = this.model.bindTools(allTools);

    const conversation: BaseMessage[] = [...messages];
    const newMessages: BaseMessage[] = [];

    const { fullResponse } = yield* this.streamChunksAndAccumulate(
      await modelWithTools.stream(conversation),
    );

    if (fullResponse) {
      newMessages.push(fullResponse);

      if (fullResponse.tool_calls && fullResponse.tool_calls.length > 0) {
        conversation.push(fullResponse);
        await this.executeRequestedTools(
          fullResponse.tool_calls,
          conversation,
          allTools,
        );
        newMessages.push(
          ...conversation.slice(
            conversation.length - fullResponse.tool_calls.length,
          ),
        );

        const { fullResponse: secondResponse } =
          yield* this.streamChunksAndAccumulate(
            await modelWithTools.stream(conversation),
          );
        if (secondResponse) newMessages.push(secondResponse);
      }
    }
    return newMessages;
  }

  public async askWithToolsAndContext(
    messages: BaseMessage[],
  ): Promise<BaseMessage[]> {
    const mcpTools = await this.mcpService.getMcpTools();
    const allTools = [
      this.currentTimeTool.get(),
      this.weatherTool.get(),
      ...mcpTools,
    ];
    const modelWithTools = this.model.bindTools(allTools);

    const conversation: BaseMessage[] = [...messages];
    const newMessages: BaseMessage[] = [];

    const response = await modelWithTools.invoke(conversation);
    newMessages.push(response);

    if (response.tool_calls && response.tool_calls.length > 0) {
      conversation.push(response);
      await this.executeRequestedTools(
        response.tool_calls,
        conversation,
        allTools,
      );
      newMessages.push(
        ...conversation.slice(conversation.length - response.tool_calls.length),
      );

      const finalResponse = await modelWithTools.invoke(conversation);
      newMessages.push(finalResponse);
    }
    return newMessages;
  }

  // --- PRIVATE HELPER METHODS ---

  private async invokeAndExtract(
    input: string | BaseMessage[],
  ): Promise<string> {
    const response = await this.model.invoke(input);
    return this.extractText(response.content);
  }

  private async invokeWithToolsAndHandle(
    question: string,
    tools: any[],
  ): Promise<string> {
    const modelWithTools = this.model.bindTools(tools);
    const messages: BaseMessage[] = [new HumanMessage(question)];
    const response = await modelWithTools.invoke(messages);
    const finalResponse = await this.handleToolCalls(
      response,
      messages,
      modelWithTools,
      tools,
    );
    return this.extractText(finalResponse.content);
  }

  private async *streamSimpleChunks(
    stream: AsyncIterable<any>,
  ): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream) {
      const content = chunk.content;
      yield content ? content.toString() : chunk.toString();
    }
  }

  private async *streamComplexChunks(
    stream: AsyncIterable<any>,
  ): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream) {
      if (typeof chunk.content === 'string') {
        if (chunk.content) yield chunk.content;
      } else if (Array.isArray(chunk.content)) {
        for (const part of chunk.content as any[]) {
          if (part.type === 'text' && part.text) {
            yield part.text;
          } else if (
            part.type === 'code_execution_call' &&
            part.code_execution_call
          ) {
            yield `\n\n\`\`\`${part.code_execution_call.language || 'python'}\n${part.code_execution_call.code}\n\`\`\`\n\n`;
          } else if (
            part.type === 'code_execution_result' &&
            part.code_execution_result
          ) {
            yield `\n**Result:**\n\`\`\`\n${part.code_execution_result.output}\n\`\`\`\n\n`;
          }
        }
      }
    }
  }

  private async *streamChunksAndAccumulate(
    stream: AsyncIterable<any>,
  ): AsyncGenerator<string, { fullResponse: any }, unknown> {
    let fullResponse: any = null;
    for await (const chunk of stream) {
      if (!fullResponse) fullResponse = chunk;
      else fullResponse = fullResponse.concat(chunk);

      const content = chunk.content;
      if (content) {
        yield typeof content === 'string' ? content : String(content);
      }
    }
    return { fullResponse };
  }

  private initializeModel(
    tools?: (StructuredTool | DynamicTool)[],
  ): ChatGoogle {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY')!;
    const modelOne = this.configService.get<string>('GOOGLE_GEMINI_MODEL_ONE')!;
    const modelTwo = this.configService.get<string>('GOOGLE_GEMINI_MODEL_TWO')!;
    const modelThree = this.configService.get<string>(
      'GOOGLE_GEMINI_MODEL_THREE',
    )!;

    const maxTokens = this.configService.get<number>('GOOGLE_MAX_TOKENS');
    const temperature = this.configService.get<number>('GOOGLE_TEMPERATURE');

    const createModel = (modelName: string) => {
      const baseInstance = new ChatGoogle(modelName, {
        apiKey,
        temperature,
        maxOutputTokens: maxTokens, // Fixed truncation wall
      });

      if (tools && tools.length > 0)
        return baseInstance.bindTools(tools) as unknown as ChatGoogle;

      return baseInstance;
    };

    const baseModel = createModel(modelOne);
    const fallbacks: ChatGoogle[] = [];

    if (modelTwo) fallbacks.push(createModel(modelTwo));
    if (modelThree) fallbacks.push(createModel(modelThree));

    const fallbackModel = baseModel.withFallbacks({ fallbacks });

    // Monkey-patch withStructuredOutput and bindTools securely
    (fallbackModel as any).withStructuredOutput = (schema: any) => {
      return baseModel.withStructuredOutput(schema).withFallbacks({
        fallbacks: fallbacks.map((m) => m.withStructuredOutput(schema)),
      });
    };

    (fallbackModel as any).bindTools = (tools: any, kwargs?: any) => {
      return baseModel.bindTools(tools, kwargs).withFallbacks({
        fallbacks: fallbacks.map((m) => m.bindTools(tools, kwargs)),
      });
    };

    return fallbackModel as unknown as ChatGoogle;
  }

  private extractText(content: unknown): string {
    if (typeof content === 'string') return content;

    if (Array.isArray(content))
      return content
        .filter((c) => c.type === 'text' && c.text)
        .map((c) => c.text)
        .join('');

    return String(content);
  }

  private async executeRequestedTools(
    toolCalls: ToolCall[],
    messages: BaseMessage[],
    availableTools: any[],
  ): Promise<void> {
    const toolsByName = Object.fromEntries(
      availableTools.map((t) => [t.name, t]),
    );

    for (const toolCall of toolCalls) {
      const tool = toolsByName[toolCall.name];
      if (tool) {
        const toolResult = await tool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id ?? '',
            name: toolCall.name,
          }),
        );
      } else {
        this.logger.warn(`Tool not found: ${toolCall.name}`);
      }
    }
  }

  private async handleToolCalls<T extends AIMessage>(
    response: T,
    messages: BaseMessage[],
    modelWithTools: Runnable<any, T>,
    availableTools?: any[],
  ): Promise<T> {
    if (response.tool_calls && response.tool_calls.length > 0) {
      messages.push(response);
      await this.executeRequestedTools(
        response.tool_calls,
        messages,
        availableTools || [this.currentTimeTool.get(), this.weatherTool.get()],
      );
      return await modelWithTools.invoke(messages);
    }
    return response;
  }
}
