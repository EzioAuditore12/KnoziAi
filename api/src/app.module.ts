import { McpModule, McpModuleOptions } from '@nestjs-mcp/server';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { BullModule, BullRootModuleOptions } from '@nestjs/bullmq';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { CloudinaryModule, CloudinaryModuleOptions } from 'nestjs-cloudinary';
import {
  FormDataInterceptorConfig,
  NestjsFormDataModule,
} from 'nestjs-form-data';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import bullmqConfig, { BULLMQ_CONFIG_NAME } from './config/bullmq.config';
import cacheConfig, { CACHE_CONFIG_NAME } from './config/cache.config';
import cloudinaryConfig, {
  CLOUDINARY_CONFIG_NAME,
} from './config/cloudinary.config';
import formDataConfig, {
  FORM_DATA_CONFIG_NAME,
} from './config/form-data.config';
import mcpConfig, { MCP_CONFIG_NAME } from './config/mcp.config';
import mongooseConfig, { MONGOOSE_CONFIG_NAME } from './config/mongoose.config';
import redisConfig, { REDIS_CONFIG_NAME } from './config/redis.config';
import throttlerConfig, {
  THROTTLER_CONFIG_NAME,
} from './config/throttler.config';
import { LlmModule } from './llm/llm.module';
import { ProjectModule } from './project/project.module';
import { PromptModule } from './prompt/prompt.module';
import { RagModule } from './rag/rag.module';
import { StatusModule } from './status/status.module';
import { UserModule } from './user/user.module';
import { injectConfig } from './utils/inject-config.util';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        cloudinaryConfig,
        formDataConfig,
        mongooseConfig,
        throttlerConfig,
        cacheConfig,
        bullmqConfig,
        redisConfig,
        mcpConfig,
      ],
    }),
    SentryModule.forRoot(),

    NestjsFormDataModule.configAsync({
      isGlobal: true,
      ...injectConfig<FormDataInterceptorConfig>(FORM_DATA_CONFIG_NAME),
    }),

    MongooseModule.forRootAsync(
      injectConfig<MongooseModuleOptions>(MONGOOSE_CONFIG_NAME),
    ),

    ThrottlerModule.forRootAsync(
      injectConfig<ThrottlerModuleOptions>(THROTTLER_CONFIG_NAME),
    ),
    CacheModule.registerAsync({
      isGlobal: true,
      ...injectConfig<CacheModuleOptions>(CACHE_CONFIG_NAME),
    }),

    BullModule.forRootAsync(
      injectConfig<BullRootModuleOptions>(BULLMQ_CONFIG_NAME),
    ),

    RedisModule.forRootAsync(
      injectConfig<RedisModuleOptions>(REDIS_CONFIG_NAME),
    ),

    CloudinaryModule.forRootAsync({
      isGlobal: true,
      ...injectConfig<CloudinaryModuleOptions>(CLOUDINARY_CONFIG_NAME),
    }),

    McpModule.forRootAsync(injectConfig<McpModuleOptions>(MCP_CONFIG_NAME)),

    UserModule,
    AuthModule,
    LlmModule,
    ChatModule,
    PromptModule,
    RagModule,
    ProjectModule,
    StatusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
