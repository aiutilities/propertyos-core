export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  entityType: string;
  initialState: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowMetrics {
  definitions: {
    total: number;
    active: number;
    inactive: number;
  };
  instances: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  history: {
    totalTransitions: number;
    averageTransitionsPerInstance: number;
  };
  completion: {
    averageCompletionTimeSeconds: number | null;
  };
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  currentState: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  metadata: Record<string, unknown>;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDefinitionsResponse {
  success: boolean;
  data: {
    definitions: WorkflowDefinition[];
  };
}

export interface WorkflowMetricsResponse {
  success: boolean;
  data: {
    metrics: WorkflowMetrics;
  };
}

export interface WorkflowInstanceResponse {
  success: boolean;
  data: {
    instance: WorkflowInstance | null;
  };
}

export type NotificationChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "PUSH"
  | "IN_APP";

export type NotificationStatus =
  | "PENDING"
  | "SENT"
  | "FAILED";

export interface NotificationMessage {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationTemplate {
  id?: string;
  code?: string;
  name?: string;
  event?: string;
  channel?: NotificationChannel;
  subject?: string;
  message?: string;
  [key: string]: unknown;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationMessage[];
  };
}

export interface NotificationTemplatesResponse {
  success: boolean;
  data: {
    templates: NotificationTemplate[];
  };
}

export type SchedulerJobStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type SchedulerScheduleType =
  | "MANUAL"
  | "ONE_TIME"
  | "RECURRING";

export interface SchedulerJob {
  id: string;
  name: string;
  jobType: string;
  status: SchedulerJobStatus;
  payload: Record<string, unknown>;
  scheduleType: SchedulerScheduleType;
  runAt?: string;
  cronExpression?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulerHandler {
  jobType: string;
}

export interface SchedulerJobsResponse {
  success: boolean;
  data: {
    jobs: SchedulerJob[];
  };
}

export interface SchedulerHandlersResponse {
  success: boolean;
  data: {
    handlers: SchedulerHandler[];
  };
}

export interface SchedulerJobResponse {
  success: boolean;
  data: {
    job: SchedulerJob;
  };
}
