import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';

import { LLM_SERVICE, type LlmService } from '../llm/interfaces/llm.interface';
import { GenerateDatasetRequestDto } from './dto/generate-dataset-request.dto';
import {
  EvaluationTaskDto,
  GenerateDatasetResponseDto,
} from './dto/generate-dataset-response.dto';
import { gradingResponseSchema } from './dto/grading-response.dto';
import { RunEvaluationMultiShotRequestDto } from './dto/run-evaluation-multi-shot-request.dto';
import { RunEvaluationOneShotRequestDto } from './dto/run-evaluation-one-shot-request.dto';
import { RunEvaluationRequestDto } from './dto/run-evaluation-request.dto';
import {
  EvaluationResultDto,
  RunEvaluationResponseDto,
} from './dto/run-evaluation-response.dto';

@Injectable()
export class PromptService {
  constructor(
    @Inject(LLM_SERVICE)
    private readonly llmService: LlmService,
  ) {}

  public async generateEvaluationDataset(
    generateDatasetRequestDto: GenerateDatasetRequestDto,
  ): Promise<GenerateDatasetResponseDto> {
    const { testCases, taskDescription, promptInputsSpec } =
      generateDatasetRequestDto;

    const promptText = `
Generate an evaluation dataset for a prompt evaluation. The dataset will be used to evaluate prompts based on the following task description:
"${taskDescription}"

Generate an array of JSON objects, each representing a distinct test case for the task.
The JSON object must contain exactly the following keys, populated with realistic test data:
${Object.entries(promptInputsSpec)
  .map(([key, desc]) => `- ${key}: ${desc}`)
  .join('\n')}

Please generate exactly ${testCases} distinct test cases.
`;

    // Dynamically build a Zod object schema using the keys from promptInputsSpec
    const schemaShape: Record<string, z.ZodString> = {};
    for (const key of Object.keys(promptInputsSpec)) {
      schemaShape[key] = z.string().describe(promptInputsSpec[key]);
    }

    const dynamicSchema = z.object({
      dataset: z
        .array(z.object({ inputs: z.object(schemaShape) }))
        .describe('An array of evaluation tasks'),
    });

    const result = await this.llmService.askWithStructuredOutput(
      promptText,
      dynamicSchema,
    );

    // Explicitly cast to the DTO shape since we used a dynamic Zod schema
    return result as GenerateDatasetResponseDto;
  }

  private async runTestCase(
    testCase: EvaluationTaskDto,
    promptTemplate: string,
    extraCriteria?: string,
    examples?: { inputs: Record<string, string>; output: string }[],
  ): Promise<EvaluationResultDto> {
    let promptText = promptTemplate;

    for (const [key, value] of Object.entries(testCase.inputs)) {
      promptText = promptText.replace(`{${key}}`, value);
    }

    if (examples && examples.length > 0) {
      let examplesText =
        'Here are some examples of expected inputs and outputs:\n\n';
      examples.forEach((example, index) => {
        let exampleInputText = promptTemplate;
        for (const [key, value] of Object.entries(example.inputs)) {
          exampleInputText = exampleInputText.replace(`{${key}}`, value);
        }
        examplesText += `Example ${index + 1}:\nInput: ${exampleInputText}\nOutput: ${example.output}\n\n`;
      });
      promptText = `${examplesText}Now solve this one:\nInput: ${promptText}\nOutput: `;
    }

    const output = await this.llmService.ask(promptText);

    // Provide the original inputs object as JSON string for the grader to evaluate against
    const taskDescriptionForGrader = JSON.stringify(testCase.inputs, null, 2);

    const { score, reasoning } = await this.modelGrader(
      taskDescriptionForGrader,
      output,
      extraCriteria,
    );

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
    extraCriteria?: string,
  ): Promise<{ score: number; reasoning: string }> {
    const promptText = `
You are an expert software evaluator.
Your job is to grade the following output based on how well it solves the given task.
The score should be between 0 and 10.
- 10 means the output perfectly solves the task and is exactly what was requested.
- 0 means the output is completely wrong or unrelated.

Task Inputs:
${task}

${extraCriteria ? `Additional Grading Criteria:\n${extraCriteria}\n` : ''}
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

    const { promptTemplate, extraCriteria } = runEvaluationRequestDto;

    const results: EvaluationResultDto[] = [];
    for (const testCase of datasetResponse.dataset) {
      results.push(
        await this.runTestCase(testCase, promptTemplate, extraCriteria),
      );
    }

    return { results };
  }

  public async runEvaluationOneShot(
    runEvaluationOneShotRequestDto: RunEvaluationOneShotRequestDto,
  ): Promise<RunEvaluationResponseDto> {
    const datasetResponse = await this.generateEvaluationDataset(
      runEvaluationOneShotRequestDto,
    );

    const { promptTemplate, extraCriteria, promptExample } =
      runEvaluationOneShotRequestDto;

    const results: EvaluationResultDto[] = [];
    for (const testCase of datasetResponse.dataset) {
      results.push(
        await this.runTestCase(testCase, promptTemplate, extraCriteria, [
          promptExample,
        ]),
      );
    }

    return { results };
  }

  //TODO: Need to send data chunk by chunk
  public async runEvaluationMultiShot(
    runEvaluationMultiShotRequestDto: RunEvaluationMultiShotRequestDto,
  ): Promise<RunEvaluationResponseDto> {
    const datasetResponse = await this.generateEvaluationDataset(
      runEvaluationMultiShotRequestDto,
    );

    const { promptTemplate, extraCriteria, promptExamples } =
      runEvaluationMultiShotRequestDto;

    const results: EvaluationResultDto[] = [];
    for (const testCase of datasetResponse.dataset) {
      results.push(
        await this.runTestCase(
          testCase,
          promptTemplate,
          extraCriteria,
          promptExamples,
        ),
      );
    }

    return { results };
  }
}
