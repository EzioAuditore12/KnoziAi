import { ConfigModule, ConfigService } from '@nestjs/config';

export const injectConfig = <T>(configName: string) => ({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    configService.get<T>(configName)!,
});
