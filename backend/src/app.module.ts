import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

import { VisitorModule } from './plugins/visitor/visitor.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,

    VisitorModule,
  ],
})
export class AppModule {}
