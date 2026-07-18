/**
 * Runtime implementation of the PropertyOS host contract.
 *
 * Standalone plugins compile against @propertyos/core-contracts.
 * At runtime this facade supplies the host's actual NestJS modules,
 * services, registries, DTOs, tokens, and shared interfaces.
 */

export { AuditModule } from '../../audit/audit.module';
export { AuditService } from '../../audit/audit.service';

export { AuthModule } from '../../auth/auth.module';
export { Permissions } from '../../auth/constants/permissions';
export { RequirePermission } from '../../auth/decorators/require-permission.decorator';
export { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
export { PermissionGuard } from '../../auth/guards/permission.guard';

export { DatabaseModule } from '../../../database/database.module';
export { PostgresModule } from '../../../database/postgres/postgres.module';
export { POSTGRES_POOL } from '../../../database/postgres/postgres.types';

export { EventBusModule } from '../../eventbus/eventbus.module';
export { EventBusService } from '../../eventbus/services/eventbus.service';

export { IdentityModule } from '../../identity/identity.module';

export type {
  PaginatedResponseDto,
} from '../../platform/dto/paginated-response.dto';

export {
  PaginationQueryDto,
  normalizePagination,
} from '../../platform/dto/pagination-query.dto';

export {
  BasePostgresRepository,
} from '../../platform/repositories/base-postgres.repository';

export { PluginModule } from '../plugin.module';
export {
  PluginNotificationRegistry,
} from '../registries/plugin-notification.registry';
export {
  PluginPermissionRegistry,
} from '../registries/plugin-permission.registry';
export {
  PluginWorkflowRegistry,
} from '../registries/plugin-workflow.registry';

export {
  SchedulerHandlerRegistry,
} from '../../scheduler/registries/scheduler-handler.registry';
export {
  SchedulerModule,
} from '../../scheduler/scheduler.module';
export {
  SchedulerService,
} from '../../scheduler/services/scheduler.service';

export type {
  SchedulerJob,
  SchedulerJobHandler,
} from '../../scheduler/types/scheduler.types';

export {
  SearchProviderRegistry,
} from '../../search/registries/search-provider.registry';
export {
  SearchModule,
} from '../../search/search.module';

export type {
  SearchProvider,
  SearchQuery,
  SearchResult,
} from '../../search/types/search.types';

export {
  WorkflowService,
} from '../../workflow/services/workflow.service';
export {
  WorkflowModule,
} from '../../workflow/workflow.module';

export {
  REPORT_EXPORT_JOB_TYPE,
} from '../../scheduler/types/report-export-job.types';

export type {
  ReportExportJobPayload,
  ScheduledReportFormat,
  ScheduledReportType,
} from '../../scheduler/types/report-export-job.types';
