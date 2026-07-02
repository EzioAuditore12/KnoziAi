import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';

export interface LlmTool {
  readonly toolName: string;
  get(): DynamicTool | DynamicStructuredTool;
}
