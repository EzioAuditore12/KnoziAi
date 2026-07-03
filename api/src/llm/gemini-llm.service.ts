import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  ToolCall,
  ToolMessage,
} from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
import { DynamicTool, StructuredTool } from '@langchain/core/tools';
import { ChatGoogle } from '@langchain/google';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import { AskWithSystemPromptDto } from './dto/ask-with-system-prompt.dto';
import {
  AskWithSystemResponseDto,
  askWithSystemResponseSchema,
} from './dto/ask-with-system-response.dto';
import { LlmService } from './interfaces/llm.interface';
import { CurrentTimeTool } from './tools/current-time.tool';
import { WeatherTool } from './tools/weather.tool';

@Injectable()
export class GeminiLlmService implements LlmService {
  private model: ChatGoogle;

  constructor(
    private readonly configService: ConfigService,
    private readonly currentTimeTool: CurrentTimeTool,
    private readonly weatherTool: WeatherTool,
  ) {
    this.model = this.initializeModel();
  }

  public async ask(question: string): Promise<string> {
    return this.invokeAndExtract(question);
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
    const modelWithTools = this.model.bindTools([
      this.currentTimeTool.get(),
      this.weatherTool.get(),
    ]);
    const conversation: BaseMessage[] = [...messages];
    const newMessages: BaseMessage[] = [];

    const { fullResponse } = yield* this.streamChunksAndAccumulate(
      await modelWithTools.stream(conversation),
    );

    if (fullResponse) {
      newMessages.push(fullResponse);

      if (fullResponse.tool_calls && fullResponse.tool_calls.length > 0) {
        conversation.push(fullResponse);
        await this.executeRequestedTools(fullResponse.tool_calls, conversation);
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
    const modelWithTools = this.model.bindTools([
      this.currentTimeTool.get(),
      this.weatherTool.get(),
    ]);
    const conversation: BaseMessage[] = [...messages];
    const newMessages: BaseMessage[] = [];

    const response = await modelWithTools.invoke(conversation);
    newMessages.push(response);

    if (response.tool_calls && response.tool_calls.length > 0) {
      conversation.push(response);
      await this.executeRequestedTools(response.tool_calls, conversation);
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
        maxRetries: 1,
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
  ): Promise<void> {
    for (const toolCall of toolCalls) {
      if (toolCall.name === this.currentTimeTool.toolName) {
        const tool = this.currentTimeTool.get();
        const toolResult = await tool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id ?? '',
            name: toolCall.name,
          }),
        );
      } else if (toolCall.name === this.weatherTool.toolName) {
        const tool = this.weatherTool.get();
        const toolResult = await tool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id ?? '',
            name: toolCall.name,
          }),
        );
      }
    }
  }

  private async handleToolCalls<T extends AIMessage>(
    response: T,
    messages: BaseMessage[],
    modelWithTools: Runnable<any, T>,
  ): Promise<T> {
    if (response.tool_calls && response.tool_calls.length > 0) {
      messages.push(response);
      await this.executeRequestedTools(response.tool_calls, messages);
      return await modelWithTools.invoke(messages);
    }
    return response;
  }
}
