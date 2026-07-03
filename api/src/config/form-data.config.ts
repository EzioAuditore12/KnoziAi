import { registerAs } from '@nestjs/config';
import {
  FileSystemStoredFile,
  FormDataInterceptorConfig,
} from 'nestjs-form-data';

export const FORM_DATA_CONFIG_NAME = 'form_data';

export default registerAs(
  FORM_DATA_CONFIG_NAME,
  (): FormDataInterceptorConfig => ({
    isGlobal: true,
    storage: FileSystemStoredFile,
    fileSystemStoragePath: '.uploads',
    // Note: autoDeleteFile is deprecated in nestjs-form-data v11+.
    autoDeleteFile: false,
    // CRITICAL: If cleanupAfterSuccessHandle is not set to false, the library will
    // automatically wipe the uploaded files from disk after the controller finishes successfully!
    cleanupAfterSuccessHandle: false,
    cleanupAfterFailedHandle: true,
  }),
);
