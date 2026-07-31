import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";

import {
  SchedulerHandlerRegistry,
} from "../../../scheduler/registries/scheduler-handler.registry";
import {
  SchedulerService,
} from "../../../scheduler/services/scheduler.service";
import {
  SchedulerJob,
  SchedulerJobHandler,
} from "../../../scheduler/types/scheduler.types";

import {
  AI_RECURRING_SCHEDULE_MATERIALIZE_JOB_TYPE,
} from "../ai-scheduling.constants";
import {
  AiPlatformScheduleBridgeService,
} from "../execution/ai-platform-schedule-bridge.service";
import {
  AiRecurringOccurrenceMaterializerService,
} from "../execution/ai-recurring-occurrence-materializer.service";
import {
  AiRecurringScheduleMaterializeJobPayload,
} from "../types/ai-schedule-job.types";

@Injectable()
export class AiRecurringScheduleMaterializeJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    AI_RECURRING_SCHEDULE_MATERIALIZE_JOB_TYPE;

  constructor(
    private readonly registry:
      SchedulerHandlerRegistry,

    private readonly materializer:
      AiRecurringOccurrenceMaterializerService,

    private readonly bridge:
      AiPlatformScheduleBridgeService,

    private readonly schedulerService:
      SchedulerService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(
    job: SchedulerJob,
  ): Promise<void> {
    const payload =
      this.validate(job.payload);

    const result =
      await this.materializer.materialize({
        scheduleId:
          payload.scheduleId,
        materializedAt:
          payload.requestedAt,
        maximumCatchUpOccurrences:
          payload.maximumCatchUpOccurrences,
      });

    if (
      result.decision === "paused" ||
      result.decision === "cancelled" ||
      result.decision === "terminal"
    ) {
      return;
    }

    for (
      const occurrence of
      result.createdOccurrences
    ) {
      await this.bridge.enqueueOccurrence(
        occurrence,
      );
    }

    for (
      const occurrence of
      result.existingOccurrences
    ) {
      await this.bridge.enqueueOccurrence(
        occurrence,
      );
    }

    if (!result.nextScheduledFor) {
      return;
    }

    const nextScheduledFor =
      new Date(
        result.nextScheduledFor,
      ).toISOString();

    await this.schedulerService
      .createOrResolveJob({
        name:
          `Materialize recurring AI schedule ${payload.scheduleId}`,
        jobType:
          AI_RECURRING_SCHEDULE_MATERIALIZE_JOB_TYPE,
        payload: {
          scheduleId:
            payload.scheduleId,
          requestedAt:
            nextScheduledFor,
          maximumCatchUpOccurrences:
            payload.maximumCatchUpOccurrences,
        },
        scheduleType:
          "ONE_TIME",
        runAt:
          nextScheduledFor,
        maxAttempts:
          3,
        idempotencyKey:
          this.idempotencyKey(
            payload.scheduleId,
            nextScheduledFor,
          ),
      });
  }

  private validate(
    payload: Record<string, unknown>,
  ): AiRecurringScheduleMaterializeJobPayload {
    if (
      typeof payload.scheduleId !==
        "string" ||
      !payload.scheduleId.trim()
    ) {
      throw new BadRequestException(
        "Recurring AI materialization job requires scheduleId",
      );
    }

    if (
      typeof payload.requestedAt !==
        "string" ||
      !payload.requestedAt.trim() ||
      Number.isNaN(
        Date.parse(
          payload.requestedAt,
        ),
      )
    ) {
      throw new BadRequestException(
        "Recurring AI materialization job requires valid requestedAt",
      );
    }

    if (
      typeof
        payload.maximumCatchUpOccurrences !==
        "number" ||
      !Number.isInteger(
        payload.maximumCatchUpOccurrences,
      ) ||
      payload.maximumCatchUpOccurrences <
        1 ||
      payload.maximumCatchUpOccurrences >
        100
    ) {
      throw new BadRequestException(
        "Recurring AI materialization job requires maximumCatchUpOccurrences between 1 and 100",
      );
    }

    return {
      scheduleId:
        payload.scheduleId.trim(),
      requestedAt:
        new Date(
          payload.requestedAt,
        ).toISOString(),
      maximumCatchUpOccurrences:
        payload.maximumCatchUpOccurrences,
    };
  }

  private idempotencyKey(
    scheduleId: string,
    nextScheduledFor: string,
  ): string {
    return [
      "ai-recurring-materialize",
      scheduleId,
      nextScheduledFor,
    ].join(":");
  }
}
