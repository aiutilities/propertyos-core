import { Module } from '@nestjs/common';
import {
  AuthModule,
} from '../auth/auth.module';
import {
  PlatformRuntimeService,
} from './runtime/platform-runtime.service';
import {
  PlatformRuntimeController,
} from './runtime/platform-runtime.controller';
import { ConsolePlatformLogger } from './logging';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    PlatformRuntimeController,
  ],
  providers: [
    ConsolePlatformLogger,
    PlatformRuntimeService,
  ],
  exports: [
    ConsolePlatformLogger,
    PlatformRuntimeService,
  ],
})
export class PlatformModule {}
