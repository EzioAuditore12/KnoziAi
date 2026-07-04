import { ApiProperty } from '@nestjs/swagger';
import { FileSystemStoredFile, IsFile } from 'nestjs-form-data';

import { AskLlmDto } from './ask-llm.dto';

export class AskLlmWithLargeFileDto extends AskLlmDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'The large file to upload via Google File API (e.g. video, huge PDF, etc.)',
  })
  @IsFile()
  file: FileSystemStoredFile;
}
