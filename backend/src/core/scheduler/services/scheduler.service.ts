import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateJobDto } from '../dto/create-job.dto';
import { PostgresSchedulerRepository } from '../repositories/postgres-scheduler.repository';
import { SchedulerHandlerRegistry } from '../registries/scheduler-handler.registry';
import { SchedulerJob, SchedulerJobHandler } from '../types/scheduler.types';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly repository: PostgresSchedulerRepository,
    private readonly handlerRegistry: SchedulerHandlerRegistry,
  ) {}

  async createJob(dto: CreateJobDto): Promise<SchedulerJob> {
    const now = new Date();

    return this.repository.create({
      id: randomUUID(),
      name: dto.name,
      jobType: dto.jobType,
      status: 'PENDING',
      payload: dto.payload ?? {},
      scheduleType: dto.scheduleType ?? 'MANUAL',
      runAt: dto.runAt ? new Date(dto.runAt) : undefined,
      cronExpression: dto.cronExpression,
      attempts: 0,
      maxAttempts: dto.maxAttempts ?? 3,
      createdAt: now,
      updatedAt: now,
    });
  }

  async listJobs(): Promise<SchedulerJob[]> {
    return this.repository.list();
  }

  async getJob(id: string): Promise<SchedulerJob> {
    const job = await this.repository.findById(id);

    if (!job) {
      throw new NotFoundException(`Scheduler job not found: ${id}`);
    }

    return job;
  }

  registerHandler(handler: SchedulerJobHandler): void {
    this.handlerRegistry.register(handler);
  }

  listHandlers(): string[] {
    return this.handlerRegistry.list();
  }

  async runJob(id: string): Promise<SchedulerJob> {
    const job = await this.getJob(id);
    const handler = this.handlerRegistry.get(job.jobType);

    if (!handler) {
      return this.repository.updateStatus(
        id,
        'FAILED',
        `No handler registered for job type: ${job.jobType}`,
      );
    }

    try {
      await this.repository.incrementAttempts(id);
      await this.repository.updateStatus(id, 'RUNNING');
      await handler.handle(job);
      return this.repository.updateStatus(id, 'COMPLETED');
    } catch (error) {
      return this.repository.updateStatus(
        id,
        'FAILED',
        error instanceof Error ? error.message : 'Unknown scheduler error',
      );
    }
  }
}
