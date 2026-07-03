import { ApiProperty } from '@nestjs/swagger';
import { FileSystemStoredFile, IsFile } from 'nestjs-form-data';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsFile()
  file: FileSystemStoredFile;
}
