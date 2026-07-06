import { SchedulerScheduleType } from '../types/scheduler.types';

export class CreateJobDto {
  name!: string;
  jobType!: string;
  payload?: Record<string, unknown>;
  scheduleType?: SchedulerScheduleType;
  runAt?: string;
  cronExpression?: string;
  maxAttempts?: number;
}
