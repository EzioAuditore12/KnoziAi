import { ApiProperty } from '@nestjs/swagger';
import { FileSystemStoredFile, HasMimeType, IsFile } from 'nestjs-form-data';

import { AskLlmDto } from './ask-llm.dto';

export class AskLlmWithPdfDto extends AskLlmDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The PDF document to analyze',
  })
  @IsFile()
  @HasMimeType(['application/pdf'])
  file: FileSystemStoredFile;
}
