import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/types/auth-jwt';
import { PaginationDto } from 'src/common/dto/pagination.dto';

import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectListResponseDto } from './dto/project-list-response.dto';
import { ProjectDto } from './dto/project.dto';
import { ProjectService } from './project.service';

@ApiTags('Project')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new project',
    description:
      'Uploads a file (PDF only) and creates a new project document for the authenticated user.',
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @UseGuards(JwtAuthGuard)
  public async create(
    @Req() req: AuthRequest,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectDto> {
    const userId = req.user.id;

    return await this.projectService.create(userId, createProjectDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all projects',
    description: "Returns a paginated list of the user's projects.",
  })
  @ApiResponse({ type: ProjectListResponseDto })
  @UseGuards(JwtAuthGuard)
  public async getAllProjects(
    @Req() req: AuthRequest,
    @Query() paginationDto: PaginationDto,
  ): Promise<ProjectListResponseDto> {
    const userId = req.user.id;
    return await this.projectService.getAllProjects(userId, paginationDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get project details',
    description:
      'Retrieves the details of a specific project by ID for the authenticated user.',
  })
  @UseGuards(JwtAuthGuard)
  public async getProjectById(
    @Req() req: AuthRequest,
    @Param('id') projectId: string,
  ): Promise<ProjectDto> {
    const userId = req.user.id;
    return await this.projectService.getProjectById(projectId, userId);
  }

  @Post(':id/project-file-embedding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process project file embeddings',
    description:
      'Downloads the project PDF, extracts text and tables, generates embeddings, and saves them to the database.',
  })
  @UseGuards(JwtAuthGuard)
  public async processFileEmbedding(
    @Req() req: AuthRequest,
    @Param('id') projectId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.projectService.processProjectFile(projectId, userId);
    return { message: 'Project file embeddings processed successfully.' };
  }
}
