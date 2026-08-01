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
  COMMUNICATIONS_PUBLISH_JOB_TYPE,
} from '../communications.constants';

import {
  CommunicationsService,
} from '../services/communications.service';

import {
  CommunicationJobPayload,
} from '../types/communications-job.types';

@Injectable()
export class PublishCommunicationJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    COMMUNICATIONS_PUBLISH_JOB_TYPE;

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

    await this.communicationsService.publish(
      communication.id,
      {
        changedByPersonId:
          communication.createdByPersonId,
        remarks:
          'Published automatically by scheduler',
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
        'Communications publish job requires communicationId',
      );
    }

    return {
      communicationId:
        payload.communicationId,
    };
  }
}
