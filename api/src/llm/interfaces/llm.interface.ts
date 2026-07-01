import { BaseMessage } from '@langchain/core/messages';

export const LLM_SERVICE = 'LLM_SERVICE';

export interface LlmService {
  ask(question: string): Promise<string>;
  askWithContext(messages: BaseMessage[]): Promise<string>;
}
