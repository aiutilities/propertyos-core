import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

import { AuditModule } from './core/audit/audit.module';
import { AuthModule } from './core/auth/auth.module';
import { AuthorizationModule } from './core/authorization/authorization.module';
import { EventBusModule } from './core/eventbus/eventbus.module';
import { IdentityModule } from './core/identity/identity.module';
import { NotificationModule } from './core/notification/notification.module';
import { PropertyModule } from './core/property/property.module';
import { TenantModule } from './core/tenant/tenant.module';
import { AgreementModule } from './core/agreement/agreement.module';
import { RentModule } from './core/rent/rent.module';
import { ReceiptModule } from './core/receipt';
import { InvoiceModule } from './core/invoice';
import { WorkflowModule } from './core/workflow';
import { PluginModule } from './core/plugin';
import { HealthModule } from './core/health/health.module';

import { VisitorModule } from './plugins/visitor/visitor.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,

    AuditModule,
    AuthModule,
    AuthorizationModule,
    EventBusModule,
    IdentityModule,
    NotificationModule,
    PropertyModule,
    TenantModule,
    AgreementModule,
    RentModule,
    ReceiptModule,
    InvoiceModule,
    WorkflowModule,
    PluginModule,
    HealthModule,

    VisitorModule,
  ],
})
export class AppModule {}
