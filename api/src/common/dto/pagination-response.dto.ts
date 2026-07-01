import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponseDto {
  @ApiProperty({ description: 'Total number of documents', example: 4 })
  totalDocs: number;

  @ApiProperty({ description: 'Number of documents per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Paging counter', example: 1 })
  pagingCounter: number;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevPage: boolean;

  @ApiProperty({ description: 'Whether there is a next page', example: false })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Previous page number',
    example: null,
    nullable: true,
  })
  prevPage: number | null;

  @ApiProperty({
    description: 'Next page number',
    example: null,
    nullable: true,
  })
  nextPage: number | null;
}
