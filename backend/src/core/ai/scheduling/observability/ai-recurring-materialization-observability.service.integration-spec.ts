import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  MetricsService,
} from "../../../metrics/services/metrics.service";
import {
  ConsolePlatformLogger,
} from "../../../platform/logging/console-platform.logger";
import {
  AiRecurringMaterializationObservabilityService,
} from "./ai-recurring-materialization-observability.service";

describe(
  "AiRecurringMaterializationObservabilityService",
  () => {
    const harness = () => {
      const incrementCounter =
        jest.fn();
      const observeHistogram =
        jest.fn();
      const info =
        jest.fn();
      const error =
        jest.fn();

      const service =
        new AiRecurringMaterializationObservabilityService(
          {
            incrementCounter,
            observeHistogram,
          } as unknown as
            MetricsService,
          {
            info,
            error,
          } as unknown as
            ConsolePlatformLogger,
        );

      return {
        service,
        incrementCounter,
        observeHistogram,
        info,
        error,
      };
    };

    it("records bounded request and completion evidence", () => {
      const {
        service,
        incrementCounter,
        observeHistogram,
        info,
      } = harness();

      const startedAt =
        service.requested({
          schedulerJobId:
            "job-1",
          scheduleId:
            "schedule-1",
          requestedAt:
            "2026-08-01T01:00:00.000Z",
        });

      service.completed({
        schedulerJobId:
          "job-1",
        scheduleId:
          "schedule-1",
        requestedAt:
          "2026-08-01T01:00:00.000Z",
        decision:
          "materialized",
        createdOccurrences: 2,
        existingOccurrences: 1,
        skippedIntervals: 3,
        nextScheduledFor:
          "2026-08-01T02:00:00.000Z",
        nextJobCreated:
          false,
        startedAt,
      });

      expect(info)
        .toHaveBeenCalledWith(
          "ai.recurring.materialization.requested",
          expect.objectContaining({
            scheduleId:
              "schedule-1",
          }),
        );

      expect(info)
        .toHaveBeenCalledWith(
          "ai.recurring.materialization.completed",
          expect.objectContaining({
            decision:
              "materialized",
            createdOccurrences: 2,
            existingOccurrences: 1,
            skippedIntervals: 3,
          }),
        );

      expect(
        incrementCounter,
      ).toHaveBeenCalled();
      expect(
        observeHistogram,
      ).toHaveBeenCalled();
    });

    it("logs failure without arbitrary payload data", () => {
      const {
        service,
        error,
      } = harness();

      service.failed({
        schedulerJobId:
          "job-1",
        scheduleId:
          "schedule-1",
        requestedAt:
          "2026-08-01T01:00:00.000Z",
        startedAt:
          Date.now(),
        error:
          new Error(
            "materialization failed",
          ),
      });

      expect(error)
        .toHaveBeenCalledWith(
          "ai.recurring.materialization.failed",
          expect.objectContaining({
            errorName: "Error",
            errorMessage:
              "materialization failed",
          }),
        );

      expect(
        JSON.stringify(
          error.mock.calls,
        ),
      ).not.toContain(
        "payload",
      );
    });

    it("uses bounded configuration defaults", () => {
      const {
        service,
      } = harness();

      const originalCatchUp =
        process.env
          .AI_RECURRING_MAX_CATCH_UP_OCCURRENCES;
      const originalAttempts =
        process.env
          .AI_RECURRING_HANDLER_MAX_ATTEMPTS;

      try {
        process.env
          .AI_RECURRING_MAX_CATCH_UP_OCCURRENCES =
          "101";
        process.env
          .AI_RECURRING_HANDLER_MAX_ATTEMPTS =
          "0";

        expect(
          service.maximumCatchUpOccurrences(),
        ).toBe(10);
        expect(
          service.handlerMaxAttempts(),
        ).toBe(3);

        process.env
          .AI_RECURRING_MAX_CATCH_UP_OCCURRENCES =
          "25";
        process.env
          .AI_RECURRING_HANDLER_MAX_ATTEMPTS =
          "5";

        expect(
          service.maximumCatchUpOccurrences(),
        ).toBe(25);
        expect(
          service.handlerMaxAttempts(),
        ).toBe(5);
      } finally {
        if (
          originalCatchUp ===
          undefined
        ) {
          delete process.env
            .AI_RECURRING_MAX_CATCH_UP_OCCURRENCES;
        } else {
          process.env
            .AI_RECURRING_MAX_CATCH_UP_OCCURRENCES =
            originalCatchUp;
        }

        if (
          originalAttempts ===
          undefined
        ) {
          delete process.env
            .AI_RECURRING_HANDLER_MAX_ATTEMPTS;
        } else {
          process.env
            .AI_RECURRING_HANDLER_MAX_ATTEMPTS =
            originalAttempts;
        }
      }
    });
  },
);
