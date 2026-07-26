import { Module } from '@nestjs/common';
import {
  PlatformRuntimeService,
} from './runtime/platform-runtime.service';
import { ConsolePlatformLogger } from './logging';

@Module({
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
