import { ChatGoogleGenerativeAI } from '@dakshp1234/langchain-google-genai';
import {
  AIMessage,
  BaseMessage,
  BaseMessageLike,
  ToolCall,
  ToolMessage,
} from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
import { DynamicTool, StructuredTool } from '@langchain/core/tools';
import { Injectable, Logger } from '@nestjs/common';
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
  private model: ChatGoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly currentTimeTool: CurrentTimeTool,
    private readonly weatherTool: WeatherTool,
  ) {
    this.model = this.initializeModel();
  }

  public async ask(question: string): Promise<string> {
    const response = await this.model.invoke(question);
    return this.extractText(response.content);
  }

  public async askWithContext(messages: BaseMessage[]): Promise<string> {
    const response = await this.model.invoke(messages);
    return this.extractText(response.content);
  }

  public async *askUsingStream(
    question: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.model.stream(question);
    for await (const chunk of stream) {
      const content = chunk.content;
      yield content ? content.toString() : chunk.toString();
    }
  }

  public async *askWithContextUsingStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.model.stream(messages);
    for await (const chunk of stream) {
      const content = chunk.content;
      yield content ? content.toString() : chunk.toString();
    }
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
    // 1. Bind tools to the model ONLY for this specific request
    const modelWithTools = this.model.bindTools([this.currentTimeTool.get()]);

    // 2. Send the initial question to the model
    const messages: BaseMessageLike[] = [['human', question]];
    const response = await modelWithTools.invoke(messages);

    // 3. Handle potential tool calls and get the final response
    const finalResponse = await this.handleToolCalls(
      response,
      messages,
      modelWithTools,
    );
    return this.extractText(finalResponse.content);
  }

  public async askWithWeather(question: string): Promise<string> {
    // 1. Bind tools to the model ONLY for this specific request
    const modelWithTools = this.model.bindTools([this.weatherTool.get()]);

    // 2. Send the initial question to the model
    const messages: BaseMessageLike[] = [['human', question]];
    const response = await modelWithTools.invoke(messages);

    // 3. Handle potential tool calls and get the final response
    const finalResponse = await this.handleToolCalls(
      response,
      messages,
      modelWithTools,
    );
    return this.extractText(finalResponse.content);
  }

  public async *askWithToolsAndContextStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, BaseMessage[], unknown> {
    const modelWithTools = this.model.bindTools([
      this.currentTimeTool.get(),
      this.weatherTool.get(),
    ]);

    const newMessages: BaseMessage[] = [];
    const conversation: BaseMessageLike[] = [...messages];

    const stream = await modelWithTools.stream(conversation);
    let fullResponse: any = null;

    for await (const chunk of stream) {
      if (!fullResponse) fullResponse = chunk;
      else fullResponse = fullResponse.concat(chunk);

      const content = chunk.content;
      if (content) {
        yield typeof content === 'string' ? content : String(content);
      }
    }

    if (fullResponse) {
      newMessages.push(fullResponse);

      if (fullResponse.tool_calls && fullResponse.tool_calls.length > 0) {
        conversation.push(fullResponse);

        for (const toolCall of fullResponse.tool_calls) {
          let toolResult = '';
          if (toolCall.name === this.currentTimeTool.toolName) {
            toolResult = await this.currentTimeTool.get().invoke(toolCall.args);
          } else if (toolCall.name === this.weatherTool.toolName) {
            toolResult = await this.weatherTool.get().invoke(toolCall.args);
          }

          const toolMessage = new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id ?? '',
            name: toolCall.name,
          });

          conversation.push(toolMessage);
          newMessages.push(toolMessage);
        }

        const secondStream = await modelWithTools.stream(conversation);
        let secondFullResponse: any = null;

        for await (const chunk of secondStream) {
          if (!secondFullResponse) secondFullResponse = chunk;
          else secondFullResponse = secondFullResponse.concat(chunk);

          const content = chunk.content;
          if (content) {
            yield typeof content === 'string' ? content : String(content);
          }
        }

        if (secondFullResponse) {
          newMessages.push(secondFullResponse);
        }
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

    const newMessages: BaseMessage[] = [];
    const conversation: BaseMessageLike[] = [...messages];

    const response = await modelWithTools.invoke(conversation);
    newMessages.push(response);

    if (response.tool_calls && response.tool_calls.length > 0) {
      conversation.push(response);

      for (const toolCall of response.tool_calls) {
        let toolResult = '';
        if (toolCall.name === this.currentTimeTool.toolName) {
          toolResult = await this.currentTimeTool.get().invoke(toolCall.args);
        } else if (toolCall.name === this.weatherTool.toolName) {
          toolResult = await this.weatherTool.get().invoke(toolCall.args);
        }

        const toolMessage = new ToolMessage({
          content: toolResult,
          tool_call_id: toolCall.id ?? '',
          name: toolCall.name,
        });

        conversation.push(toolMessage);
        newMessages.push(toolMessage);
      }

      const finalResponse = await modelWithTools.invoke(conversation);
      newMessages.push(finalResponse);
    }

    return newMessages;
  }

  private initializeModel(
    tools?: (StructuredTool | DynamicTool)[],
  ): ChatGoogleGenerativeAI {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY')!;
    const modelOne = this.configService.get<string>('GOOGLE_GEMINI_MODEL_ONE')!;
    const modelTwo = this.configService.get<string>('GOOGLE_GEMINI_MODEL_TWO')!;
    const modelThree = this.configService.get<string>(
      'GOOGLE_GEMINI_MODEL_THREE',
    )!;

    const maxTokens = this.configService.get<number>('GOOGLE_MAX_TOKENS');
    const temperature = this.configService.get<number>('GOOGLE_TEMPERATURE');

    const createModel = (modelName: string) => {
      const baseInstance = new ChatGoogleGenerativeAI(modelName, {
        apiKey,
        temperature,
        maxOutputTokens: maxTokens, // Fixed truncation wall
        maxRetries: 1,
      });

      if (tools && tools.length > 0)
        return baseInstance.bindTools(
          tools,
        ) as unknown as ChatGoogleGenerativeAI;

      return baseInstance;
    };

    const baseModel = createModel(modelOne);
    const fallbacks: ChatGoogleGenerativeAI[] = [];

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

    return fallbackModel as unknown as ChatGoogleGenerativeAI;
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
    messages: BaseMessageLike[],
  ): Promise<void> {
    for (const toolCall of toolCalls) {
      if (toolCall.name === this.currentTimeTool.toolName) {
        const tool = this.currentTimeTool.get();
        // Invoke the tool with the arguments provided by the model
        const toolResult = await tool.invoke(toolCall.args);

        // Append the tool's result back into the conversation history
        messages.push({
          role: 'tool',
          content: toolResult,
          tool_call_id: toolCall.id,
          name: toolCall.name,
        });
      } else if (toolCall.name === this.weatherTool.toolName) {
        const tool = this.weatherTool.get();
        // Invoke the tool with the arguments provided by the model
        const toolResult = await tool.invoke(toolCall.args);

        // Append the tool's result back into the conversation history
        messages.push({
          role: 'tool',
          content: toolResult,
          tool_call_id: toolCall.id,
          name: toolCall.name,
        });
      }
    }
  }

  private async handleToolCalls<T extends AIMessage>(
    response: T,
    messages: BaseMessageLike[],
    modelWithTools: Runnable<BaseMessageLike[], T>,
  ): Promise<T> {
    // Check if the model decided to call any tools
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Append the model's tool call request to the conversation history
      messages.push(response);

      // Execute all requested tools
      await this.executeRequestedTools(response.tool_calls, messages);

      // Send the conversation back to the model so it can formulate a final answer using the tool data
      return await modelWithTools.invoke(messages);
    }

    return response;
  }
}
