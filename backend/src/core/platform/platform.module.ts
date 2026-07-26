import {
  PlatformIdempotencyContextBuilder,
} from './idempotency/http/platform-idempotency-context-builder.service';
import {
  PlatformIdempotencyInterceptor,
} from './idempotency/http/platform-idempotency.interceptor';
import {
  PostgresModule,
} from '../../database/postgres/postgres.module';
import {
  PlatformIdempotencyRepository,
} from './idempotency/repositories/platform-idempotency.repository';
import {
  PostgresPlatformIdempotencyRepository,
} from './idempotency/repositories/postgres-platform-idempotency.repository';
import {
  PlatformIdempotencyFingerprintService,
} from './idempotency/services/platform-idempotency-fingerprint.service';
import {
  PlatformIdempotencyService,
} from './idempotency/services/platform-idempotency.service';
import { Module } from '@nestjs/common';
import {
  AuthModule,
} from '../auth/auth.module';
import {
  MetricsModule,
} from '../metrics/metrics.module';
import {
  PlatformRuntimeService,
} from './runtime/platform-runtime.service';
import {
  PlatformRuntimeController,
} from './runtime/platform-runtime.controller';
import { ConsolePlatformLogger } from './logging';

@Module({
  imports: [
    MetricsModule,
    PostgresModule,
    AuthModule,
  ],
  controllers: [
    PlatformRuntimeController,
  ],
  providers: [
    PlatformIdempotencyContextBuilder,
    PlatformIdempotencyInterceptor,
    PlatformIdempotencyFingerprintService,
    PlatformIdempotencyService,
    {
      provide:
        PlatformIdempotencyRepository,
      useClass:
        PostgresPlatformIdempotencyRepository,
    },
    ConsolePlatformLogger,
    PlatformRuntimeService,
  ],
  exports: [
    PlatformIdempotencyContextBuilder,
    PlatformIdempotencyFingerprintService,
    PlatformIdempotencyService,
    PlatformIdempotencyRepository,
    ConsolePlatformLogger,
    PlatformRuntimeService,
  ],
})
export class PlatformModule {}
