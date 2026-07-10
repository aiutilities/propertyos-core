import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';
import { ConsolePlatformLogger } from './core/platform';
import { SchedulerWorkerService } from './core/scheduler';

async function bootstrap(): Promise<void> {
  validateEnvironment();

  const app = await NestFactory.createApplicationContext(
    AppModule,
    {
      logger: false,
    },
  );

  app.enableShutdownHooks();

  const logger = app.get(ConsolePlatformLogger);
  const worker = app.get(SchedulerWorkerService);

  process.on('uncaughtException', (error) => {
    logger.error('scheduler.worker.uncaught_exception', {
      errorMessage: error.message,
      stack: error.stack,
    });

    process.exitCode = 1;
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('scheduler.worker.unhandled_rejection', {
      reason:
        reason instanceof Error
          ? reason.message
          : String(reason),
    });

    process.exitCode = 1;
  });

  await worker.start();
}

void bootstrap();
