import { unlink } from 'node:fs/promises';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { CloudinaryService } from 'nestjs-cloudinary';
import { FormDataRequest } from 'nestjs-form-data';

import { AppService } from './app.service';
import { GetCacheDto } from './common/dto/get-cache.dto';
import { SetCacheDto } from './common/dto/set-cache.dto';
import { UploadFileDto } from './common/dto/upload-file.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
  public async uploadFile(@Body() uploadFileDto: UploadFileDto) {
    // The file is already safely written to your './uploads' disk folder here
    const savedFile = uploadFileDto.file;

    const uploadedFile =
      await this.cloudinaryService.cloudinaryInstance.uploader.upload(
        savedFile.path,
      );

    await unlink(savedFile.path);

    return {
      message: 'File uploaded to Cloudinary successfully!',
      originalName: savedFile.originalName,
      size: savedFile.size,
      url: uploadedFile.url,
    };
  }
}
