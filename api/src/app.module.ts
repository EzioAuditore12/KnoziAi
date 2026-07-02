import { BullModule, BullRootModuleOptions } from '@nestjs/bullmq';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import bullmqConfig, { BULLMQ_CONFIG_NAME } from './config/bullmq.config';
import cacheConfig, { CACHE_CONFIG_NAME } from './config/cache.config';
import mongooseConfig, { MONGOOSE_CONFIG_NAME } from './config/mongoose.config';
import throttlerConfig, {
  THROTTLER_CONFIG_NAME,
} from './config/throttler.config';
import { LlmModule } from './llm/llm.module';
import { PromptModule } from './prompt/prompt.module';
import { UserModule } from './user/user.module';

const injectConfig = <T>(configName: string) => ({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    configService.get<T>(configName)!,
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mongooseConfig, throttlerConfig, cacheConfig, bullmqConfig],
    }),
    SentryModule.forRoot(),

    MongooseModule.forRootAsync(
      injectConfig<MongooseModuleOptions>(MONGOOSE_CONFIG_NAME),
    ),

    ThrottlerModule.forRootAsync(
      injectConfig<ThrottlerModuleOptions>(THROTTLER_CONFIG_NAME),
    ),

    CacheModule.registerAsync(
      injectConfig<CacheModuleOptions>(CACHE_CONFIG_NAME),
    ),

    BullModule.forRootAsync(
      injectConfig<BullRootModuleOptions>(BULLMQ_CONFIG_NAME),
    ),

    UserModule,
    AuthModule,
    LlmModule,
    ChatModule,
    PromptModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
