import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';

import { ProjectDto } from './project.dto';

export class ProjectListResponseDto extends PaginationResponseDto {
  @ApiProperty({
    type: [ProjectDto],
    description: 'List of projects in this page',
  })
  @Type(() => ProjectDto)
  docs: ProjectDto[];
}
