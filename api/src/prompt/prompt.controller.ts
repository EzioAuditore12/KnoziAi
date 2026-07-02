import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';

import { GenerateDatasetRequestDto } from './dto/generate-dataset-request.dto';
import { GradeRequestDto } from './dto/grade-request.dto';
import { RunEvaluationMultiShotRequestDto } from './dto/run-evaluation-multi-shot-request.dto';
import { RunEvaluationOneShotRequestDto } from './dto/run-evaluation-one-shot-request.dto';
import { RunEvaluationRequestDto } from './dto/run-evaluation-request.dto';
import { PromptService } from './prompt.service';

@ApiTags('Prompt')
@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('grade/model')
  @ApiOperation({
    summary: 'Standalone Model Grader',
    description:
      'Use the model grader to evaluate an LLM output against a task.',
  })
  public async gradeModel(@Body() gradeRequestDto: GradeRequestDto) {
    return await this.promptService.modelGrader(
      gradeRequestDto.task,
      gradeRequestDto.output,
    );
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('grade/code')
  @ApiOperation({
    summary: 'Standalone Code Grader',
    description:
      'Use the code grader to evaluate if code correctly solves a task.',
  })
  public async gradeCode(@Body() gradeRequestDto: GradeRequestDto) {
    return await this.promptService.codeGrader(
      gradeRequestDto.task,
      gradeRequestDto.output,
    );
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('generate-dataset')
  @ApiOperation({
    summary: 'Generate an evaluation dataset',
    description: 'Generate a dataset of coding tasks for prompt evaluation.',
  })
  public async generateEvaluationDataset(
    @Body() generateDatasetRequestDto: GenerateDatasetRequestDto,
  ) {
    const response = await this.promptService.generateEvaluationDataset(
      generateDatasetRequestDto,
    );
    return response;
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('run-evaluation')
  @ApiOperation({
    summary: 'Run prompt evaluation pipeline (Zero-Shot)',
    description:
      'Run a dataset of tasks against the LLM to evaluate the prompt without examples.',
  })
  public async runEvaluation(
    @Body() runEvaluationRequestDto: RunEvaluationRequestDto,
  ) {
    const response = await this.promptService.runEvaluation(
      runEvaluationRequestDto,
    );
    return response;
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('run-evaluation/one-shot')
  @ApiOperation({
    summary: 'Run prompt evaluation pipeline (One-Shot)',
    description:
      'Run a dataset of tasks against the LLM to evaluate the prompt with a single example.',
  })
  public async runEvaluationOneShot(
    @Body() runEvaluationOneShotRequestDto: RunEvaluationOneShotRequestDto,
  ) {
    const response = await this.promptService.runEvaluationOneShot(
      runEvaluationOneShotRequestDto,
    );
    return response;
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('run-evaluation/multi-shot')
  @ApiOperation({
    summary: 'Run prompt evaluation pipeline (Multi-Shot)',
    description:
      'Run a dataset of tasks against the LLM to evaluate the prompt with multiple examples.',
  })
  public async runEvaluationMultiShot(
    @Body() runEvaluationMultiShotRequestDto: RunEvaluationMultiShotRequestDto,
  ) {
    const response = await this.promptService.runEvaluationMultiShot(
      runEvaluationMultiShotRequestDto,
    );
    return response;
  }
}
