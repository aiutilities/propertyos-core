import {
  Injectable,
} from '@nestjs/common';

import {
  SchedulerService,
} from '@propertyos/core-contracts';

import {
  COMMUNICATIONS_EXPIRE_JOB_TYPE,
  COMMUNICATIONS_PUBLISH_JOB_TYPE,
} from '../communications.constants';

import {
  Communication,
} from '../types/communications.types';

@Injectable()
export class CommunicationsSchedulerService {
  constructor(
    private readonly schedulerService:
      SchedulerService,
  ) {}

  async schedulePublication(
    communication: Communication,
  ): Promise<void> {
    if (!communication.publishAt) {
      return;
    }

    if (
      communication.publishAt.getTime() <=
      Date.now()
    ) {
      return;
    }

    await this.schedulerService.createJob({
      name:
        `Publish communication ${communication.communicationNumber}`,
      jobType:
        COMMUNICATIONS_PUBLISH_JOB_TYPE,
      payload: {
        communicationId:
          communication.id,
      },
      scheduleType:
        'ONE_TIME',
      runAt:
        communication.publishAt.toISOString(),
      maxAttempts: 3,
    });
  }

  async scheduleExpiry(
    communication: Communication,
  ): Promise<void> {
    if (!communication.expiresAt) {
      return;
    }

    if (
      communication.expiresAt.getTime() <=
      Date.now()
    ) {
      return;
    }

    await this.schedulerService.createJob({
      name:
        `Expire communication ${communication.communicationNumber}`,
      jobType:
        COMMUNICATIONS_EXPIRE_JOB_TYPE,
      payload: {
        communicationId:
          communication.id,
      },
      scheduleType:
        'ONE_TIME',
      runAt:
        communication.expiresAt.toISOString(),
      maxAttempts: 3,
    });
  }
}
