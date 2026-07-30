import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";

import {
  SchedulerHandlerRegistry,
} from "../../../scheduler/registries/scheduler-handler.registry";

import {
  SchedulerJob,
  SchedulerJobHandler,
} from "../../../scheduler/types/scheduler.types";

import {
  AI_SCHEDULE_OCCURRENCE_JOB_TYPE,
} from "../ai-scheduling.constants";

import {
  AiScheduleLifecycleService,
} from "../execution/ai-schedule-lifecycle.service";

import {
  AiScheduledOccurrenceExecutionService,
} from "../execution/ai-scheduled-occurrence-execution.service";

import {
  AiScheduleOccurrenceJobPayload,
} from "../types/ai-schedule-job.types";

@Injectable()
export class AiScheduleOccurrenceJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    AI_SCHEDULE_OCCURRENCE_JOB_TYPE;

  constructor(
    private readonly registry:
      SchedulerHandlerRegistry,

    private readonly lifecycleService:
      AiScheduleLifecycleService,

    private readonly executionService:
      AiScheduledOccurrenceExecutionService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(
    job: SchedulerJob,
  ): Promise<void> {
    const payload =
      this.validate(job.payload);

    const claimedAt =
      new Date().toISOString();

    const claimExpiresAt =
      new Date(
        Date.parse(claimedAt) +
          this.claimTtlMs(),
      ).toISOString();

    await this.lifecycleService
      .claimOccurrence(
        payload.occurrenceId,
        this.workerId(job),
        claimedAt,
        claimExpiresAt,
      );

    await this.executionService
      .executeOccurrence({
        occurrenceId:
          payload.occurrenceId,
        workerId:
          this.workerId(job),
        executedAt:
          new Date().toISOString(),
      });
  }

  private validate(
    payload: Record<string, unknown>,
  ): AiScheduleOccurrenceJobPayload {
    if (
      typeof payload.occurrenceId !==
        "string" ||
      !payload.occurrenceId.trim()
    ) {
      throw new BadRequestException(
        "Scheduled AI occurrence job requires occurrenceId",
      );
    }

    return {
      occurrenceId:
        payload.occurrenceId,
    };
  }

  private workerId(
    job: SchedulerJob,
  ): string {
    return `platform-scheduler:${job.id}`;
  }

  private claimTtlMs(): number {
    const configured =
      Number(
        process.env
          .AI_SCHEDULE_CLAIM_TTL_MS,
      );

    return (
      Number.isInteger(configured) &&
      configured > 0
    )
      ? configured
      : 300000;
  }
}
