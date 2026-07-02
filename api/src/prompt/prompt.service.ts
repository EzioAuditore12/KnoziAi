import { Inject, Injectable } from '@nestjs/common';

import { LLM_SERVICE, type LlmService } from '../llm/interfaces/llm.interface';
import { GenerateDatasetRequestDto } from './dto/generate-dataset-request.dto';
import {
  EvaluationTaskDto,
  GenerateDatasetResponseDto,
  generateDatasetResponseSchema,
} from './dto/generate-dataset-response.dto';
import { gradingResponseSchema } from './dto/grading-response.dto';
import { RunEvaluationRequestDto } from './dto/run-evaluation-request.dto';
import {
  EvaluationResultDto,
  RunEvaluationResponseDto,
} from './dto/run-evaluation-response.dto';

@Injectable()
export class PromptService {
  constructor(@Inject(LLM_SERVICE) private readonly llmService: LlmService) {}

  public async generateEvaluationDataset(
    generateDatasetRequestDto: GenerateDatasetRequestDto,
  ): Promise<GenerateDatasetResponseDto> {
    const { testCases, query } = generateDatasetRequestDto;
    const promptText = `
Generate an evaluation dataset for a prompt evaluation. The dataset will be used to evaluate prompts based on the following topic:
"${query}"

Generate an array of JSON objects, each representing a distinct task related to the topic.
* Focus on tasks that can be solved by writing a single function, a single JSON object, or a single regex
* Focus on tasks that do not require writing much code

Please generate exactly ${testCases} objects.
`;

    return await this.llmService.askWithStructuredOutput(
      promptText,
      generateDatasetResponseSchema,
    );
  }

  private async runTestCase(
    testCase: EvaluationTaskDto,
  ): Promise<EvaluationResultDto> {
    const promptText = `Please solve the following task:\n\n${testCase.task}`;
    const output = await this.llmService.ask(promptText);

    const { score, reasoning } = await this.modelGrader(testCase.task, output);

    return {
      output,
      testCase,
      score,
      reasoning,
    };
  }

  public async modelGrader(
    task: string,
    output: string,
  ): Promise<{ score: number; reasoning: string }> {
    const promptText = `
You are an expert software evaluator.
Your job is to grade the following output based on how well it solves the given task.
The score should be between 0 and 10.
- 10 means the output perfectly solves the task and is exactly what was requested.
- 0 means the output is completely wrong or unrelated.

Task:
${task}

Output to evaluate:
${output}
`;

    const response = await this.llmService.askWithStructuredOutput(
      promptText,
      gradingResponseSchema,
    );
    return {
      score: response.score,
      reasoning: response.reasoning,
    };
  }

  public async codeGrader(
    task: string,
    output: string,
  ): Promise<{ score: number; reasoning: string }> {
    const promptText = `
You are an expert code reviewer and software engineer.
Your job is to grade the following code output based on how well it solves the given task.
The score should be between 0 and 10.
Consider the following criteria:
- Does the code syntactically compile/run?
- Does it correctly and efficiently implement the algorithm/logic requested in the task?
- Is the code idiomatic, maintainable, and free of security issues?
- Deduct points if the output includes unnecessary markdown explanations when only raw code was requested (or vice versa).

Task:
${task}

Code Output to evaluate:
${output}
`;

    const response = await this.llmService.askWithStructuredOutput(
      promptText,
      gradingResponseSchema,
    );
    return {
      score: response.score,
      reasoning: response.reasoning,
    };
  }

  public async runEvaluation(
    runEvaluationRequestDto: RunEvaluationRequestDto,
  ): Promise<RunEvaluationResponseDto> {
    const datasetResponse = await this.generateEvaluationDataset(
      runEvaluationRequestDto,
    );

    const results = await Promise.all(
      datasetResponse.dataset.map((testCase) => this.runTestCase(testCase)),
    );

    return { results };
  }
}
