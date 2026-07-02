import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  public getHello(): string {
    return 'Hello World!';
  }

  public async setCache(key: string, value: string): Promise<void> {
    await this.cacheManager.set(key, value);
  }

  public async getCache(key: string): Promise<string | undefined> {
    return this.cacheManager.get<string>(key);
  }
}
