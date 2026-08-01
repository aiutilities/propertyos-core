import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';
import { ConsolePlatformLogger, setupSwagger } from './core/platform';
import {
  registerCoreContractsHostRuntime,
} from './core/plugin/runtime/core-contracts-host-runtime';

async function bootstrap() {
  validateEnvironment();
  registerCoreContractsHostRuntime();

  const app = await NestFactory.create(
    AppModule,
    {
      rawBody:
        true,
    },
  );
  const logger = app.get(ConsolePlatformLogger);

  app.enableShutdownHooks();

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');
  setupSwagger(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  logger.info('api.started', {
    port,
    baseUrl: `http://localhost:${port}/api/v1`,
    docsUrl: `http://localhost:${port}/api/docs`,
  });
}

bootstrap();
