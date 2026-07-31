import {
  AiRecurringOccurrenceCalculationRequest,
  AiRecurringOccurrenceCalculationResult,
  AiRecurringOccurrenceCandidate,
} from "../types/ai-recurring-materialization.types";

const MILLISECONDS_PER_SECOND = 1000;
const MINIMUM_INTERVAL_SECONDS = 60;
const MINIMUM_CATCH_UP_OCCURRENCES = 1;
const MAXIMUM_CATCH_UP_OCCURRENCES = 100;

export class AiRecurringOccurrenceCalculatorService {
  calculate(
    request: AiRecurringOccurrenceCalculationRequest,
  ): AiRecurringOccurrenceCalculationResult {
    const anchorMs = this.parseTimestamp(
      request.anchor,
      "anchor",
    );
    const materializedAtMs = this.parseTimestamp(
      request.materializedAt,
      "materializedAt",
    );
    const intervalMs = this.intervalMilliseconds(
      request.intervalSeconds,
    );

    this.validateMaximumCatchUp(
      request.maximumCatchUpOccurrences,
    );

    const latestRepresentedIntervalIndex =
      this.resolveLatestRepresentedIntervalIndex(
        request.latestScheduledFor,
        anchorMs,
        intervalMs,
      );

    const latestDueIntervalIndex =
      materializedAtMs <= anchorMs
        ? 0
        : Math.floor(
            (materializedAtMs - anchorMs) /
              intervalMs,
          );

    const firstUnrepresentedIntervalIndex =
      latestRepresentedIntervalIndex + 1;

    const dueIntervalCount = Math.max(
      0,
      latestDueIntervalIndex -
        firstUnrepresentedIntervalIndex +
        1,
    );

    const skippedIntervals = Math.max(
      0,
      dueIntervalCount -
        request.maximumCatchUpOccurrences,
    );

    const firstMaterializedIntervalIndex =
      firstUnrepresentedIntervalIndex +
      skippedIntervals;

    const createdCandidates =
      this.createCandidates(
        firstMaterializedIntervalIndex,
        latestDueIntervalIndex,
        anchorMs,
        intervalMs,
      );

    const nextIntervalIndex = Math.max(
      latestDueIntervalIndex + 1,
      latestRepresentedIntervalIndex + 1,
      1,
    );

    return {
      anchor: new Date(anchorMs).toISOString(),
      intervalSeconds: request.intervalSeconds,
      materializedAt:
        new Date(materializedAtMs).toISOString(),
      latestRepresentedIntervalIndex,
      latestDueIntervalIndex,
      createdCandidates,
      skippedIntervals,
      nextScheduledFor: this.scheduledFor(
        anchorMs,
        intervalMs,
        nextIntervalIndex,
      ),
      decision:
        createdCandidates.length > 0
          ? "materialized"
          : "not_due",
    };
  }

  private createCandidates(
    firstIntervalIndex: number,
    latestDueIntervalIndex: number,
    anchorMs: number,
    intervalMs: number,
  ): AiRecurringOccurrenceCandidate[] {
    if (
      firstIntervalIndex >
      latestDueIntervalIndex
    ) {
      return [];
    }

    const candidates: AiRecurringOccurrenceCandidate[] =
      [];

    for (
      let intervalIndex =
        firstIntervalIndex;
      intervalIndex <=
      latestDueIntervalIndex;
      intervalIndex += 1
    ) {
      candidates.push({
        intervalIndex,
        scheduledFor: this.scheduledFor(
          anchorMs,
          intervalMs,
          intervalIndex,
        ),
      });
    }

    return candidates;
  }

  private resolveLatestRepresentedIntervalIndex(
    latestScheduledFor: string | undefined,
    anchorMs: number,
    intervalMs: number,
  ): number {
    if (!latestScheduledFor) {
      return 0;
    }

    const latestScheduledForMs =
      this.parseTimestamp(
        latestScheduledFor,
        "latestScheduledFor",
      );

    if (latestScheduledForMs <= anchorMs) {
      throw new Error(
        "latestScheduledFor must be later than anchor",
      );
    }

    const elapsedMs =
      latestScheduledForMs - anchorMs;

    if (elapsedMs % intervalMs !== 0) {
      throw new Error(
        "latestScheduledFor must align with the deterministic interval sequence",
      );
    }

    const intervalIndex =
      elapsedMs / intervalMs;

    if (
      !Number.isSafeInteger(intervalIndex) ||
      intervalIndex < 1
    ) {
      throw new Error(
        "latestScheduledFor resolves to an invalid interval index",
      );
    }

    return intervalIndex;
  }

  private intervalMilliseconds(
    intervalSeconds: number,
  ): number {
    if (
      !Number.isSafeInteger(intervalSeconds) ||
      intervalSeconds <
        MINIMUM_INTERVAL_SECONDS
    ) {
      throw new Error(
        `intervalSeconds must be a safe integer greater than or equal to ${MINIMUM_INTERVAL_SECONDS}`,
      );
    }

    const intervalMs =
      intervalSeconds *
      MILLISECONDS_PER_SECOND;

    if (!Number.isSafeInteger(intervalMs)) {
      throw new Error(
        "intervalSeconds exceeds the supported deterministic range",
      );
    }

    return intervalMs;
  }

  private validateMaximumCatchUp(
    maximumCatchUpOccurrences: number,
  ): void {
    if (
      !Number.isSafeInteger(
        maximumCatchUpOccurrences,
      ) ||
      maximumCatchUpOccurrences <
        MINIMUM_CATCH_UP_OCCURRENCES ||
      maximumCatchUpOccurrences >
        MAXIMUM_CATCH_UP_OCCURRENCES
    ) {
      throw new Error(
        `maximumCatchUpOccurrences must be an integer between ${MINIMUM_CATCH_UP_OCCURRENCES} and ${MAXIMUM_CATCH_UP_OCCURRENCES}`,
      );
    }
  }

  private parseTimestamp(
    timestamp: string,
    field: string,
  ): number {
    if (
      typeof timestamp !== "string" ||
      !timestamp.trim()
    ) {
      throw new Error(
        `${field} must be a valid timestamp`,
      );
    }

    const parsed = Date.parse(timestamp);

    if (!Number.isFinite(parsed)) {
      throw new Error(
        `${field} must be a valid timestamp`,
      );
    }

    return parsed;
  }

  private scheduledFor(
    anchorMs: number,
    intervalMs: number,
    intervalIndex: number,
  ): string {
    if (
      !Number.isSafeInteger(intervalIndex) ||
      intervalIndex < 1
    ) {
      throw new Error(
        "intervalIndex must be a positive safe integer",
      );
    }

    const timestamp =
      anchorMs +
      intervalMs * intervalIndex;

    if (
      !Number.isSafeInteger(timestamp) ||
      !Number.isFinite(timestamp)
    ) {
      throw new Error(
        "Calculated occurrence timestamp exceeds the supported range",
      );
    }

    const result = new Date(timestamp);

    if (Number.isNaN(result.getTime())) {
      throw new Error(
        "Calculated occurrence timestamp is invalid",
      );
    }

    return result.toISOString();
  }
}
