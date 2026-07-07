import { Module } from '@nestjs/common';
import { PostgresProvider } from './postgres.provider';
import { PostgresShutdownService } from './postgres-shutdown.service';

@Module({
  providers: [PostgresProvider, PostgresShutdownService],
  exports: [PostgresProvider],
})
export class PostgresModule {}
