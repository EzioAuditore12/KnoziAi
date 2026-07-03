import { registerAs } from '@nestjs/config';
import { CloudinaryModuleOptions } from 'nestjs-cloudinary';
import { env } from 'src/env';

export const CLOUDINARY_CONFIG_NAME = 'cloudinary';

export default registerAs(
  CLOUDINARY_CONFIG_NAME,
  (): CloudinaryModuleOptions => ({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  }),
);
