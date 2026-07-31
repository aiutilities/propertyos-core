import {
  Injectable,
} from "@nestjs/common";

import {
  SchedulerService,
} from "../../../scheduler/services/scheduler.service";

import {
  AI_SCHEDULE_OCCURRENCE_JOB_TYPE,
} from "../ai-scheduling.constants";

import {
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";

@Injectable()
export class AiPlatformScheduleBridgeService {
  constructor(
    private readonly schedulerService:
      SchedulerService,
  ) {}

  async enqueueOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<void> {
    await this.schedulerService
      .createOrResolveJob({
        name:
          `Execute AI schedule occurrence ${occurrence.id}`,
        jobType:
          AI_SCHEDULE_OCCURRENCE_JOB_TYPE,
        payload: {
          occurrenceId:
            occurrence.id,
        },
        scheduleType:
          "ONE_TIME",
        runAt:
          occurrence.scheduledFor,
        maxAttempts:
          1,
        idempotencyKey:
          `ai-schedule-occurrence:${occurrence.id}`,
      });
  }
}
