import { registerAs } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { env } from 'src/env';

export const MONGOOSE_CONFIG_NAME = 'mongoose';

export default registerAs(MONGOOSE_CONFIG_NAME, (): MongooseModuleOptions => ({
  uri: env.DATABASE_URL,
}));
