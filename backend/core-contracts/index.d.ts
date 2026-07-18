/**
 * Type facade for the private PropertyOS host runtime bridge.
 *
 * Runtime values are supplied by index.js. These declarations
 * intentionally avoid importing backend source files so standalone
 * plugin compilation remains isolated from the host source tree.
 */

export const AuditModule: any;
export type AuditModule = any;
export const AuditService: any;
export type AuditService = any;

export const AuthModule: any;
export type AuthModule = any;
export const Permissions: any;
export const RequirePermission: any;
export const JwtAuthGuard: any;
export type JwtAuthGuard = any;
export const PermissionGuard: any;
export type PermissionGuard = any;

export const DatabaseModule: any;
export type DatabaseModule = any;
export const PostgresModule: any;
export type PostgresModule = any;
export const POSTGRES_POOL: any;

export const EventBusModule: any;
export type EventBusModule = any;
export const EventBusService: any;
export type EventBusService = any;

export const IdentityModule: any;
export type IdentityModule = any;

export interface PaginatedResponseDto<
  TData = unknown,
> {
  items: TData[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class PaginationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function normalizePagination(
  query?: PaginationQueryDto,
): {
  page: number;
  limit: number;
  offset: number;
};

export const BasePostgresRepository: any;
export type BasePostgresRepository<
  TData = any,
> = any;

export const PluginModule: any;
export type PluginModule = any;

export const PluginNotificationRegistry: any;
export type PluginNotificationRegistry = any;

export const PluginDashboardRegistry: any;
export type PluginDashboardRegistry = any;

export type PluginDashboardContributor<
  TMetrics = Record<string, unknown>,
> = any;

export type PluginDashboardMetrics =
  Record<string, unknown>;

export const PluginPermissionRegistry: any;
export type PluginPermissionRegistry = any;

export const PluginWorkflowRegistry: any;
export type PluginWorkflowRegistry = any;

export const SchedulerHandlerRegistry: any;
export type SchedulerHandlerRegistry = any;

export const SchedulerModule: any;
export type SchedulerModule = any;

export const SchedulerService: any;
export type SchedulerService = any;

export type SchedulerJob<
  TPayload = unknown,
> = any;

export type SchedulerJobHandler<
  TPayload = unknown,
> = any;

export const SearchProviderRegistry: any;
export type SearchProviderRegistry = any;

export const SearchModule: any;
export type SearchModule = any;

export type SearchProvider = any;
export type SearchQuery = any;
export type SearchResult<
  TData = unknown,
> = any;

export const WorkflowService: any;
export type WorkflowService = any;

export const WorkflowModule: any;
export type WorkflowModule = any;

export const REPORT_EXPORT_JOB_TYPE: string;

export type ReportExportJobPayload = any;
export type ScheduledReportFormat = any;
export type ScheduledReportType = any;
