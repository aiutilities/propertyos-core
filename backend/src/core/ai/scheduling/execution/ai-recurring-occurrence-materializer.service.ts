import {
  Inject,
  Injectable,
} from "@nestjs/common";
import { randomUUID } from "crypto";

import {
  AiScheduleNotFoundError,
} from "../errors/ai-schedule.error";
import {
  AI_SCHEDULE_REPOSITORY,
  AiScheduleRepository,
} from "../repositories/ai-schedule.repository";
import {
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";
import {
  AiRecurringMaterializationRequest,
  AiRecurringMaterializationResult,
} from "../types/ai-recurring-materialization.types";
import {
  AiRecurringOccurrenceCalculatorService,
} from "./ai-recurring-occurrence-calculator.service";

@Injectable()
export class AiRecurringOccurrenceMaterializerService {
  constructor(
    @Inject(AI_SCHEDULE_REPOSITORY)
    private readonly repository:
      AiScheduleRepository,

    private readonly calculator:
      AiRecurringOccurrenceCalculatorService,
  ) {}

  async materialize(
    request: AiRecurringMaterializationRequest,
  ): Promise<AiRecurringMaterializationResult> {
    const schedule =
      await this.repository.getSchedule(
        request.scheduleId,
      );

    if (!schedule) {
      throw new AiScheduleNotFoundError(
        request.scheduleId,
      );
    }

    const intervalSeconds =
      schedule.intervalSeconds ?? 0;

    const base = {
      scheduleId: schedule.id,
      scheduleStatus: schedule.status,
      anchor: schedule.createdAt,
      intervalSeconds,
      materializedAt:
        new Date(
          request.materializedAt,
        ).toISOString(),
      createdOccurrences: [] as
        AiScheduledOccurrence[],
      existingOccurrences: [] as
        AiScheduledOccurrence[],
      skippedIntervals: 0,
    };

    if (schedule.scheduleType !== "interval") {
      return {
        ...base,
        decision: "terminal",
      };
    }

    if (schedule.status === "paused") {
      return {
        ...base,
        decision: "paused",
      };
    }

    if (schedule.status === "cancelled") {
      return {
        ...base,
        decision: "cancelled",
      };
    }

    if (schedule.status === "completed") {
      return {
        ...base,
        decision: "terminal",
      };
    }

    const history =
      await this.repository.listExecutionHistory({
        scheduleId: schedule.id,
        limit: 1,
      });

    const latestScheduledFor =
      history[0]?.scheduledFor;

    const calculation =
      this.calculator.calculate({
        anchor: schedule.createdAt,
        intervalSeconds,
        materializedAt:
          request.materializedAt,
        latestScheduledFor,
        maximumCatchUpOccurrences:
          request.maximumCatchUpOccurrences,
      });

    const createdOccurrences:
      AiScheduledOccurrence[] = [];
    const existingOccurrences:
      AiScheduledOccurrence[] = [];

    for (
      const candidate of
      calculation.createdCandidates
    ) {
      const occurrence:
        AiScheduledOccurrence = {
          id: randomUUID(),
          scheduleId: schedule.id,
          sequence:
            candidate.intervalIndex,
          scheduledFor:
            candidate.scheduledFor,
          status: "pending",
          attemptCount: 0,
          createdAt:
            calculation.materializedAt,
          updatedAt:
            calculation.materializedAt,
        };

      const resolved =
        await this.repository
          .createOrResolveOccurrence(
            occurrence,
          );

      if (resolved.created) {
        createdOccurrences.push(
          resolved.occurrence,
        );
      } else {
        existingOccurrences.push(
          resolved.occurrence,
        );
      }
    }

    return {
      scheduleId: schedule.id,
      scheduleStatus: schedule.status,
      anchor: calculation.anchor,
      intervalSeconds:
        calculation.intervalSeconds,
      materializedAt:
        calculation.materializedAt,
      createdOccurrences,
      existingOccurrences,
      skippedIntervals:
        calculation.skippedIntervals,
      nextScheduledFor:
        calculation.nextScheduledFor,
      decision:
        calculation.decision,
    };
  }
}
