import { Injectable } from '@nestjs/common';
import { SchedulerJobHandler } from '../types/scheduler.types';

@Injectable()
export class SchedulerHandlerRegistry {
  private readonly handlers = new Map<string, SchedulerJobHandler>();

  register(handler: SchedulerJobHandler): void {
    this.handlers.set(handler.jobType, handler);
  }

  get(jobType: string): SchedulerJobHandler | undefined {
    return this.handlers.get(jobType);
  }

  list(): string[] {
    return Array.from(this.handlers.keys()).sort();
  }
}
