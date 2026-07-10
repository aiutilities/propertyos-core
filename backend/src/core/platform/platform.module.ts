import { Module } from '@nestjs/common';
import { ConsolePlatformLogger } from './logging';

@Module({
  providers: [ConsolePlatformLogger],
  exports: [ConsolePlatformLogger],
})
export class PlatformModule {}
