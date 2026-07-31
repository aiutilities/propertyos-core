import {
  Injectable,
} from "@nestjs/common";

import {
  MetricsService,
} from "../../../metrics/services/metrics.service";
import {
  ConsolePlatformLogger,
} from "../../../platform/logging/console-platform.logger";
type AiRecurringObservabilityDecision =
  | "materialized"
  | "not_due"
  | "paused"
  | "cancelled"
  | "terminal";

interface CompletionInput {
  schedulerJobId: string;
  scheduleId: string;
  requestedAt: string;
  decision: AiRecurringObservabilityDecision;
  createdOccurrences: number;
  existingOccurrences: number;
  skippedIntervals: number;
  nextScheduledFor?: string;
  nextJobCreated?: boolean;
  startedAt: number;
}

@Injectable()
export class AiRecurringMaterializationObservabilityService {
  constructor(
    private readonly metrics: MetricsService,
    private readonly logger: ConsolePlatformLogger,
  ) {}

  requested(input: {
    schedulerJobId: string;
    scheduleId: string;
    requestedAt: string;
  }): number {
    this.logger.info(
      "ai.recurring.materialization.requested",
      input,
    );

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_materialization_requests_total",
      help:
        "Total recurring AI materialization requests.",
      labels: {
        jobType:
          "AI_RECURRING_SCHEDULE_MATERIALIZE",
      },
    });

    return Date.now();
  }

  completed(
    input: CompletionInput,
  ): void {
    this.logger.info(
      "ai.recurring.materialization.completed",
      {
        schedulerJobId: input.schedulerJobId,
        scheduleId: input.scheduleId,
        requestedAt: input.requestedAt,
        decision: input.decision,
        createdOccurrences:
          input.createdOccurrences,
        existingOccurrences:
          input.existingOccurrences,
        skippedIntervals:
          input.skippedIntervals,
        nextScheduledFor:
          input.nextScheduledFor,
        nextJobCreated:
          input.nextJobCreated,
        durationMs:
          Date.now() - input.startedAt,
      },
    );

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_materialization_success_total",
      help:
        "Total successful recurring AI materializations.",
      labels: {
        outcome: "success",
      },
    });

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_materialization_decisions_total",
      help:
        "Total recurring AI materialization decisions.",
      labels: {
        decision: input.decision,
      },
    });

    this.recordCounts(input);
    this.recordDuration(
      input.startedAt,
      "success",
    );
  }

  stopped(
    input: CompletionInput,
  ): void {
    this.logger.info(
      "ai.recurring.materialization.stopped",
      {
        schedulerJobId: input.schedulerJobId,
        scheduleId: input.scheduleId,
        requestedAt: input.requestedAt,
        decision: input.decision,
        durationMs:
          Date.now() - input.startedAt,
      },
    );

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_materialization_success_total",
      help:
        "Total successful recurring AI materializations.",
      labels: {
        outcome: "stopped",
      },
    });

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_materialization_decisions_total",
      help:
        "Total recurring AI materialization decisions.",
      labels: {
        decision: input.decision,
      },
    });

    this.recordDuration(
      input.startedAt,
      "stopped",
    );
  }

  occurrenceRegistered(input: {
    schedulerJobId: string;
    scheduleId: string;
    recovery: boolean;
  }): void {
    this.logger.info(
      "ai.recurring.occurrence.registered",
      input,
    );

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_occurrence_registrations_total",
      help:
        "Total recurring AI occurrence scheduler registrations.",
      labels: {
        outcome:
          input.recovery
            ? "recovered"
            : "created",
      },
    });
  }

  nextJobResolved(input: {
    schedulerJobId: string;
    scheduleId: string;
    nextScheduledFor: string;
    created: boolean;
  }): void {
    this.logger.info(
      "ai.recurring.next_job.resolved",
      input,
    );

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_next_jobs_total",
      help:
        "Total recurring AI next materialization jobs created or resolved.",
      labels: {
        outcome:
          input.created
            ? "created"
            : "resolved",
      },
    });
  }

  failed(input: {
    schedulerJobId: string;
    scheduleId?: string;
    requestedAt?: string;
    startedAt: number;
    error: unknown;
  }): void {
    const normalized =
      this.normalizeError(
        input.error,
      );

    this.logger.error(
      "ai.recurring.materialization.failed",
      {
        schedulerJobId: input.schedulerJobId,
        scheduleId: input.scheduleId,
        requestedAt: input.requestedAt,
        durationMs:
          Date.now() - input.startedAt,
        errorName: normalized.name,
        errorMessage: normalized.message,
      },
    );

    this.metrics.incrementCounter({
      name:
        "propertyos_ai_recurring_materialization_failures_total",
      help:
        "Total failed recurring AI materializations.",
      labels: {
        outcome: "failure",
        errorName: normalized.name,
      },
    });

    this.recordDuration(
      input.startedAt,
      "failure",
    );
  }

  maximumCatchUpOccurrences(): number {
    return this.boundedInteger(
      "AI_RECURRING_MAX_CATCH_UP_OCCURRENCES",
      10,
      1,
      100,
    );
  }

  handlerMaxAttempts(): number {
    return this.boundedInteger(
      "AI_RECURRING_HANDLER_MAX_ATTEMPTS",
      3,
      1,
      10,
    );
  }

  private recordCounts(
    input: CompletionInput,
  ): void {
    const values = [
      ["created", input.createdOccurrences],
      ["recovered", input.existingOccurrences],
      ["skipped", input.skippedIntervals],
    ] as const;

    for (const [outcome, value] of values) {
      this.metrics.incrementCounter({
        name:
          "propertyos_ai_recurring_materialization_items_total",
        help:
          "Total recurring AI materialization items.",
        labels: {
          outcome,
        },
        value,
      });
    }
  }

  private recordDuration(
    startedAt: number,
    outcome: string,
  ): void {
    this.metrics.observeHistogram({
      name:
        "propertyos_ai_recurring_materialization_duration_ms",
      help:
        "Recurring AI materialization duration in milliseconds.",
      labels: {
        outcome,
      },
      value:
        Date.now() - startedAt,
    });
  }

  private boundedInteger(
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ): number {
    const configured =
      Number(
        process.env[key],
      );

    return (
      Number.isInteger(configured) &&
      configured >= minimum &&
      configured <= maximum
    )
      ? configured
      : fallback;
  }

  private normalizeError(
    error: unknown,
  ): {
    name: string;
    message: string;
  } {
    if (error instanceof Error) {
      return {
        name: error.name || "Error",
        message:
          error.message ||
          "Unknown error",
      };
    }

    return {
      name: "UnknownError",
      message: "Unknown error",
    };
  }
}
