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
  COMMUNICATIONS_EXPIRE_JOB_TYPE,
} from '../communications.constants';

import {
  CommunicationsService,
} from '../services/communications.service';

import {
  CommunicationJobPayload,
} from '../types/communications-job.types';

@Injectable()
export class ExpireCommunicationJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    COMMUNICATIONS_EXPIRE_JOB_TYPE;

  constructor(
    private readonly registry:
      SchedulerHandlerRegistry,
    private readonly communicationsService:
      CommunicationsService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(
    job: SchedulerJob,
  ): Promise<void> {
    const payload =
      this.validate(job.payload);

    const communication =
      await this.communicationsService.get(
        payload.communicationId,
      );

    await this.communicationsService.expire(
      communication.id,
      {
        changedByPersonId:
          communication.createdByPersonId,
        remarks:
          'Expired automatically by scheduler',
      },
    );
  }

  private validate(
    payload: Record<string, unknown>,
  ): CommunicationJobPayload {
    if (
      typeof payload.communicationId !==
        'string' ||
      !payload.communicationId.trim()
    ) {
      throw new BadRequestException(
        'Communications expiry job requires communicationId',
      );
    }

    return {
      communicationId:
        payload.communicationId,
    };
  }
}
