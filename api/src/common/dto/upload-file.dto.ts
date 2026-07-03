import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { FileSystemStoredFile, IsFile } from 'nestjs-form-data';

export class UploadFileDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsFile()
  file: FileSystemStoredFile;
}
