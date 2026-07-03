import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/types/auth-jwt';

import { CreateProjectDto } from './dto/create-project.dto';
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
}
