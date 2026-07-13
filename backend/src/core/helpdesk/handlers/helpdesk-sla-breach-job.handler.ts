import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  SchedulerHandlerRegistry,
} from '../../scheduler/registries/scheduler-handler.registry';
import {
  SchedulerJob,
  SchedulerJobHandler,
} from '../../scheduler/types/scheduler.types';
import {
  HELPDESK_SLA_BREACH_JOB_TYPE,
} from '../helpdesk.constants';
import {
  HelpdeskSlaJobPayload,
} from '../types/helpdesk-job.types';
import {
  HelpdeskSlaService,
} from '../services/helpdesk-sla.service';

@Injectable()
export class HelpdeskSlaBreachJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    HELPDESK_SLA_BREACH_JOB_TYPE;

  constructor(
    private readonly registry:
      SchedulerHandlerRegistry,
    private readonly slaService:
      HelpdeskSlaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(
    job: SchedulerJob,
  ): Promise<void> {
    const payload =
      this.validate(job.payload);

    await this.slaService.processBreach(
      payload.ticketId,
    );
  }

  private validate(
    payload: Record<string, unknown>,
  ): HelpdeskSlaJobPayload {
    if (
      typeof payload.ticketId !== 'string' ||
      !payload.ticketId.trim()
    ) {
      throw new BadRequestException(
        'Helpdesk SLA breach job requires ticketId',
      );
    }

    return {
      ticketId: payload.ticketId,
    };
  }
}
