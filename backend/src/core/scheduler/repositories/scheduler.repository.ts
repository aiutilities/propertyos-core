import {
  SchedulerJob,
  SchedulerJobCreateOrResolveResult,
  SchedulerJobStatus,
} from '../types/scheduler.types';

export interface SchedulerRepository {
  create(job: SchedulerJob): Promise<SchedulerJob>;

  createOrResolve(
    job: SchedulerJob,
  ): Promise<SchedulerJobCreateOrResolveResult>;

  findById(id: string): Promise<SchedulerJob | null>;

  list(): Promise<SchedulerJob[]>;

  updateStatus(
    id: string,
    status: SchedulerJobStatus,
    errorMessage?: string,
  ): Promise<SchedulerJob>;

  incrementAttempts(id: string): Promise<void>;

  claimDueOneTimeJobs(
    limit: number,
  ): Promise<SchedulerJob[]>;

  completeClaimedJob(id: string): Promise<SchedulerJob>;

  failClaimedJob(
    id: string,
    errorMessage: string,
    retryAt?: Date,
  ): Promise<SchedulerJob>;

  recoverStaleRunningJobs(
    staleBefore: Date,
  ): Promise<number>;
}
