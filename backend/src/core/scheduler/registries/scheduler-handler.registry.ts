import { Injectable } from '@nestjs/common';
import { SchedulerJobHandler } from '../types/scheduler.types';
import {
  SchedulerHandlerAlreadyRegisteredError,
  SchedulerHandlerNotFoundError,
} from '../errors/scheduler-handler.error';

@Injectable()
export class SchedulerHandlerRegistry {
  private readonly handlers = new Map<string, SchedulerJobHandler>();

  register(handler: SchedulerJobHandler): void {
    const existing =
      this.handlers.get(handler.jobType);

    if (existing === handler) {
      return;
    }

    if (existing) {
      throw new SchedulerHandlerAlreadyRegisteredError(
        handler.jobType,
      );
    }

    this.handlers.set(
      handler.jobType,
      handler,
    );
  }

  get(jobType: string): SchedulerJobHandler | undefined {
    return this.handlers.get(jobType);
  }

  resolve(jobType: string): SchedulerJobHandler {
    const handler =
      this.handlers.get(jobType);

    if (!handler) {
      throw new SchedulerHandlerNotFoundError(
        jobType,
      );
    }

    return handler;
  }

  list(): string[] {
    return Array.from(this.handlers.keys()).sort();
  }
}
