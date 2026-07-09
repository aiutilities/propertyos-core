import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

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
import { AdminModule } from './core/admin';
import { ThemeModule } from './core/theme';
import { CredentialModule } from './core/credential';
import { AiModule } from './core/ai';
import { DistributionModule } from './core/distribution';
import { IntegrationModule } from './core/integration';
import { FormsModule } from './core/forms';
import { DocumentModule } from './core/document';
import { SearchModule } from './core/search';
import { ConfigurationModule } from './core/configuration';
import { StorageModule } from './core/storage';
import { UploadModule } from './core/upload';
import { SchedulerModule } from './core/scheduler';
import { HealthModule } from './core/health/health.module';
import { MetricsModule } from './core/metrics';
import { BootstrapModule } from './core/bootstrap/bootstrap.module';

import { PlatformModule } from './core/platform';
import { GlobalExceptionFilter } from './core/platform/filters/global-exception.filter';
import { RequestIdMiddleware } from './core/platform/middleware/request-id.middleware';
import { RequestLoggingMiddleware } from './core/platform/middleware/request-logging.middleware';
import { VisitorModule } from './plugins/visitor/visitor.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 100),
      },
    ]),
    ConfigModule,
    DatabaseModule,
    PlatformModule,

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
    AdminModule,
    ThemeModule,
    CredentialModule,
    AiModule,
    DistributionModule,
    IntegrationModule,
    FormsModule,
    DocumentModule,
    SearchModule,
    ConfigurationModule,
    StorageModule,
    UploadModule,
    SchedulerModule,
    HealthModule,
    MetricsModule,
    BootstrapModule,

    VisitorModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, RequestLoggingMiddleware).forRoutes('*');
  }
}
