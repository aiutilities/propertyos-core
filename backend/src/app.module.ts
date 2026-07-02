import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

import { AuditModule } from './core/audit/audit.module';
import { AuthorizationModule } from './core/authorization/authorization.module';
import { EventBusModule } from './core/eventbus/eventbus.module';
import { IdentityModule } from './core/identity/identity.module';
import { NotificationModule } from './core/notification/notification.module';
import { HealthModule } from './core/health/health.module';

import { VisitorModule } from './plugins/visitor/visitor.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,

    AuditModule,
    AuthorizationModule,
    EventBusModule,
    IdentityModule,
    NotificationModule,
    HealthModule,

    VisitorModule,
  ],
})
export class AppModule {}
