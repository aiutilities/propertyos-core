import {
  PlatformRuntimeService,
} from '../runtime/platform-runtime.service';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PropertyOS API')
    .setDescription('Enterprise plugin-first property management platform API')
    .setVersion(
      PlatformRuntimeService
        .resolveApiVersion(),
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste a valid PropertyOS JWT access token.',
      },
      'JWT',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
