import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

import { AuditModule } from './core/audit/audit.module';
import { IdentityModule } from './core/identity/identity.module';

import { VisitorModule } from './plugins/visitor/visitor.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,

    AuditModule,
    IdentityModule,

    VisitorModule,
  ],
})
export class AppModule {}
