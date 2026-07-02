import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

const openApiConfig = new DocumentBuilder()
  .setTitle('KnoziAi')
  .setDescription('The api documentation for KnoziAi Nestjs Backend')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();

export function openApiDocsInit(app: NestExpressApplication) {
  const document = SwaggerModule.createDocument(app, openApiConfig);

  app.use(
    '/api',
    apiReference({
      content: document,
      theme: 'default',
    }),
  );
}
