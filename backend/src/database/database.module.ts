import { Module } from '@nestjs/common';
import { PostgresModule } from './postgres';

@Module({
  imports: [PostgresModule],
  exports: [PostgresModule],
})
export class DatabaseModule {}
