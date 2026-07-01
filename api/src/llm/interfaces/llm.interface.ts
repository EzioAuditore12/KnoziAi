export const LLM_SERVICE = 'LLM_SERVICE';

export interface LlmService {
  ask(question: string): Promise<string>;
}
