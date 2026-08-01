import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import { SchedulerHandlerRegistry } from '@propertyos/core-contracts';
import {
  SchedulerJob,
  SchedulerJobHandler,
} from '@propertyos/core-contracts';
import {
  MAINTENANCE_SLA_OVERDUE_JOB_TYPE,
} from '../maintenance.constants';
import {
  MaintenanceSlaJobPayload,
} from '../types/maintenance-sla-job.types';
import { MaintenanceSlaService } from '../services/maintenance-sla.service';

@Injectable()
export class MaintenanceSlaOverdueJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    MAINTENANCE_SLA_OVERDUE_JOB_TYPE;

  constructor(
    private readonly registry:
      SchedulerHandlerRegistry,
    private readonly slaService:
      MaintenanceSlaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(job: SchedulerJob): Promise<void> {
    const payload = this.validate(job.payload);

    await this.slaService.processOverdue(
      payload.ticketId,
    );
  }

  private validate(
    payload: Record<string, unknown>,
  ): MaintenanceSlaJobPayload {
    if (
      typeof payload.ticketId !== 'string' ||
      !payload.ticketId.trim()
    ) {
      throw new BadRequestException(
        'Maintenance SLA overdue job requires ticketId',
      );
    }

    return {
      ticketId: payload.ticketId,
      ticketNumber:
        typeof payload.ticketNumber === 'string'
          ? payload.ticketNumber
          : '',
      propertyId:
        typeof payload.propertyId === 'string'
          ? payload.propertyId
          : '',
    };
  }
}
