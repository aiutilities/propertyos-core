import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  SchedulerHandlerRegistry,
} from '@propertyos/core-contracts';
import {
  SchedulerJob,
  SchedulerJobHandler,
} from '@propertyos/core-contracts';
import {
  HELPDESK_SLA_WARNING_JOB_TYPE,
} from '../helpdesk.constants';
import {
  HelpdeskSlaJobPayload,
} from '../types/helpdesk-job.types';
import {
  HelpdeskSlaService,
} from '../services/helpdesk-sla.service';

@Injectable()
export class HelpdeskSlaWarningJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    HELPDESK_SLA_WARNING_JOB_TYPE;

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

    await this.slaService.processWarning(
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
        'Helpdesk SLA warning job requires ticketId',
      );
    }

    return {
      ticketId: payload.ticketId,
    };
  }
}
