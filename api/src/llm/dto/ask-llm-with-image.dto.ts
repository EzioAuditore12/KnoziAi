import { ApiProperty } from '@nestjs/swagger';
import { FileSystemStoredFile, HasMimeType, IsFile } from 'nestjs-form-data';

import { AskLlmDto } from './ask-llm.dto';

export class AskLlmWithImageDto extends AskLlmDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The image to analyze',
  })
  @IsFile()
  @HasMimeType(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  file: FileSystemStoredFile;
}
