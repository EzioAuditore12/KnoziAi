import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';

import { AppService } from './app.service';
import { GetCacheDto } from './common/dto/get-cache.dto';
import { SetCacheDto } from './common/dto/set-cache.dto';
import { UploadFileDto } from './common/dto/upload-file.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug-sentry')
  public getError() {
    throw new Error('My first Sentry error!');
  }

  @Post('cache')
  public async setCache(@Body() body: SetCacheDto) {
    await this.appService.setCache(body.key, body.value);
    return { success: true };
  }

  @Get('cache')
  public async getCache(@Query() query: GetCacheDto) {
    const value = await this.appService.getCache(query.key);
    return { key: query.key, value };
  }

  @Post('upload-file')
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  public uploadFile(@Body() uploadFileDto: UploadFileDto) {
    // The file is already safely written to your './uploads' disk folder here
    const savedFile = uploadFileDto.file;

    return {
      message: 'File saved to disk successfully!',
      originalName: savedFile.originalName,
      savedPath: savedFile.path, // This shows the actual path on your server
      size: savedFile.size,
    };
  }
}
