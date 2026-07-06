import { SchedulerJob, SchedulerJobStatus } from '../types/scheduler.types';

export interface SchedulerRepository {
  create(job: SchedulerJob): Promise<SchedulerJob>;

  findById(id: string): Promise<SchedulerJob | null>;

  list(): Promise<SchedulerJob[]>;

  updateStatus(
    id: string,
    status: SchedulerJobStatus,
    errorMessage?: string,
  ): Promise<SchedulerJob>;

  incrementAttempts(id: string): Promise<void>;
}
