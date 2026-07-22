import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AccessControlModule } from "./core/access-control";

import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";

import { AuditModule } from "./core/audit/audit.module";
import { AuthModule } from "./core/auth/auth.module";
import { JwtAuthGuard } from "./core/auth/guards/jwt-auth.guard";
import { PermissionGuard } from "./core/auth/guards/permission.guard";
import { AuthorizationModule } from "./core/authorization/authorization.module";
import { EventBusModule } from "./core/eventbus/eventbus.module";
import { IdentityModule } from "./core/identity/identity.module";
import { NotificationModule } from "./core/notification/notification.module";
import { PropertyModule } from "./core/property/property.module";
import { WorkflowModule } from "./core/workflow";
import { PluginModule } from "./core/plugin";
import { resolveRuntimeBusinessModules } from "./core/plugin/runtime/plugin-runtime-bootstrap";
import { AdminModule } from "./core/admin";
import { ThemeModule } from "./core/theme";
import { CredentialModule } from "./core/credential";
import { AiModule } from "./core/ai";
import { DistributionModule } from "./core/distribution";
import { IntegrationModule } from "./core/integration";
import { FormsModule } from "./core/forms";
import { DocumentModule } from "./core/document";
import { SearchModule } from "./core/search";
import { ConfigurationModule } from "./core/configuration";
import { StorageModule } from "./core/storage";
import { UploadModule } from "./core/upload";
import { SchedulerModule } from "./core/scheduler";
import { HealthModule } from "./core/health/health.module";
import { MetricsModule } from "./core/metrics";
import { BootstrapModule } from "./core/bootstrap/bootstrap.module";

import { PlatformModule } from "./core/platform";
import { GlobalExceptionFilter } from "./core/platform/filters/global-exception.filter";
import { RequestIdMiddleware } from "./core/platform/middleware/request-id.middleware";
import { RequestLoggingMiddleware } from "./core/platform/middleware/request-logging.middleware";
import { VisitorModule } from "./plugins/visitor/visitor.module";

const runtimeBusinessModules = resolveRuntimeBusinessModules();

@Module({
  imports: [
    AccessControlModule,
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
    runtimeBusinessModules.tenant,
    runtimeBusinessModules.agreement,
    runtimeBusinessModules.rent,
    runtimeBusinessModules.receipt,
    runtimeBusinessModules.invoice,
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
    runtimeBusinessModules.maintenance,
    runtimeBusinessModules.facility,
    runtimeBusinessModules.inventory,
    runtimeBusinessModules.vehicle,
    runtimeBusinessModules.staff,
    runtimeBusinessModules.report,
    runtimeBusinessModules.reservation,
    runtimeBusinessModules.helpdesk,
    runtimeBusinessModules.communications,
    runtimeBusinessModules.vendor,
    runtimeBusinessModules.procurement,
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
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: PermissionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RequestLoggingMiddleware)
      .forRoutes("*");
  }
}
