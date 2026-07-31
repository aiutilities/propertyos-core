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
import {
  AiRecurringMaterializationObservabilityService,
} from "../observability/ai-recurring-materialization-observability.service";

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

    private readonly observability:
      AiRecurringMaterializationObservabilityService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(
    job: SchedulerJob,
  ): Promise<void> {
    const startedAt =
      Date.now();

    let payload:
      AiRecurringScheduleMaterializeJobPayload |
      undefined;

    try {
      payload =
        this.validate(job.payload);

      const observedStartedAt =
        this.observability.requested({
          schedulerJobId:
            job.id,
          scheduleId:
            payload.scheduleId,
          requestedAt:
            payload.requestedAt,
        });

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
        this.observability.stopped({
          schedulerJobId:
            job.id,
          scheduleId:
            payload.scheduleId,
          requestedAt:
            payload.requestedAt,
          decision:
            result.decision,
          createdOccurrences:
            0,
          existingOccurrences:
            0,
          skippedIntervals:
            result.skippedIntervals,
          startedAt:
            observedStartedAt,
        });

        return;
      }

    for (
      const occurrence of
      result.createdOccurrences
    ) {
      await this.bridge.enqueueOccurrence(
        occurrence,
      );

      this.observability
        .occurrenceRegistered({
          schedulerJobId:
            job.id,
          scheduleId:
            payload.scheduleId,
          recovery:
            true,
        });

      this.observability
        .occurrenceRegistered({
          schedulerJobId:
            job.id,
          scheduleId:
            payload.scheduleId,
          recovery:
            false,
        });
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
        this.observability.completed({
          schedulerJobId:
            job.id,
          scheduleId:
            payload.scheduleId,
          requestedAt:
            payload.requestedAt,
          decision:
            result.decision,
          createdOccurrences:
            result.createdOccurrences.length,
          existingOccurrences:
            result.existingOccurrences.length,
          skippedIntervals:
            result.skippedIntervals,
          startedAt:
            observedStartedAt,
        });

        return;
      }

    const nextScheduledFor =
      new Date(
        result.nextScheduledFor,
      ).toISOString();

      const nextJob =
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
          this.observability
            .handlerMaxAttempts(),
        idempotencyKey:
          this.idempotencyKey(
            payload.scheduleId,
            nextScheduledFor,
          ),
      });

      this.observability.nextJobResolved({
        schedulerJobId:
          job.id,
        scheduleId:
          payload.scheduleId,
        nextScheduledFor,
        created:
          nextJob.created,
      });

      this.observability.completed({
        schedulerJobId:
          job.id,
        scheduleId:
          payload.scheduleId,
        requestedAt:
          payload.requestedAt,
        decision:
          result.decision,
        createdOccurrences:
          result.createdOccurrences.length,
        existingOccurrences:
          result.existingOccurrences.length,
        skippedIntervals:
          result.skippedIntervals,
        nextScheduledFor,
        nextJobCreated:
          nextJob.created,
        startedAt:
          observedStartedAt,
      });
    } catch (error) {
      this.observability.failed({
        schedulerJobId:
          job.id,
        scheduleId:
          payload?.scheduleId,
        requestedAt:
          payload?.requestedAt,
        startedAt,
        error,
      });

      throw error;
    }
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
