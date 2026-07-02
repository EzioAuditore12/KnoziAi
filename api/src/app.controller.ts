import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { AppService } from './app.service';
import { GetCacheDto } from './common/dto/get-cache.dto';
import { SetCacheDto } from './common/dto/set-cache.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/debug-sentry')
  getError() {
    throw new Error('My first Sentry error!');
  }

  @Post('/cache')
  async setCache(@Body() body: SetCacheDto) {
    await this.appService.setCache(body.key, body.value);
    return { success: true };
  }

  @Get('/cache')
  async getCache(@Query() query: GetCacheDto) {
    const value = await this.appService.getCache(query.key);
    return { key: query.key, value };
  }
}
