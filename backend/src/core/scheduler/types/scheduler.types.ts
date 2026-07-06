export type SchedulerJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type SchedulerScheduleType =
  | 'MANUAL'
  | 'ONE_TIME'
  | 'RECURRING';

export interface SchedulerJob {
  id: string;
  name: string;
  jobType: string;
  status: SchedulerJobStatus;
  payload: Record<string, unknown>;
  scheduleType: SchedulerScheduleType;
  runAt?: Date;
  cronExpression?: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerJobHandler {
  readonly jobType: string;
  handle(job: SchedulerJob): Promise<void>;
}
