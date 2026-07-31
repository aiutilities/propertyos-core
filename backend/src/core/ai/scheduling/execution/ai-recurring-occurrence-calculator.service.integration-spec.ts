import {
  describe,
  expect,
  it,
} from "@jest/globals";
import { AiRecurringOccurrenceCalculatorService } from "./ai-recurring-occurrence-calculator.service";

const calculator =
  new AiRecurringOccurrenceCalculatorService();

const calculate = (
  overrides: Partial<
    Parameters<
      AiRecurringOccurrenceCalculatorService["calculate"]
    >[0]
  > = {},
) =>
  calculator.calculate({
    anchor: "2026-08-01T00:00:00.000Z",
    intervalSeconds: 3600,
    materializedAt:
      "2026-08-01T00:00:00.000Z",
    maximumCatchUpOccurrences: 10,
    ...overrides,
  });

describe(
  "AiRecurringOccurrenceCalculatorService",
  () => {
    it("returns not due before the first interval", () => {
      const result = calculate({
        materializedAt:
          "2026-08-01T00:59:59.999Z",
      });

      expect(result).toMatchObject({
        latestRepresentedIntervalIndex: 0,
        latestDueIntervalIndex: 0,
        createdCandidates: [],
        skippedIntervals: 0,
        nextScheduledFor:
          "2026-08-01T01:00:00.000Z",
        decision: "not_due",
      });
    });

    it("materializes the first interval exactly when due", () => {
      const result = calculate({
        materializedAt:
          "2026-08-01T01:00:00.000Z",
      });

      expect(result.createdCandidates).toEqual([
        {
          intervalIndex: 1,
          scheduledFor:
            "2026-08-01T01:00:00.000Z",
        },
      ]);
      expect(result.nextScheduledFor).toBe(
        "2026-08-01T02:00:00.000Z",
      );
      expect(result.decision).toBe(
        "materialized",
      );
    });

    it("materializes deterministic subsequent intervals", () => {
      const result = calculate({
        materializedAt:
          "2026-08-01T03:15:00.000Z",
        latestScheduledFor:
          "2026-08-01T01:00:00.000Z",
      });

      expect(result.createdCandidates).toEqual([
        {
          intervalIndex: 2,
          scheduledFor:
            "2026-08-01T02:00:00.000Z",
        },
        {
          intervalIndex: 3,
          scheduledFor:
            "2026-08-01T03:00:00.000Z",
        },
      ]);
      expect(result.nextScheduledFor).toBe(
        "2026-08-01T04:00:00.000Z",
      );
    });

    it("does not recreate represented intervals", () => {
      const result = calculate({
        materializedAt:
          "2026-08-01T03:30:00.000Z",
        latestScheduledFor:
          "2026-08-01T03:00:00.000Z",
      });

      expect(result).toMatchObject({
        latestRepresentedIntervalIndex: 3,
        latestDueIntervalIndex: 3,
        createdCandidates: [],
        skippedIntervals: 0,
        nextScheduledFor:
          "2026-08-01T04:00:00.000Z",
        decision: "not_due",
      });
    });

    it("uses the immutable anchor without cumulative drift", () => {
      const result = calculate({
        anchor:
          "2026-08-01T00:00:00.500Z",
        intervalSeconds: 90,
        materializedAt:
          "2026-08-01T00:06:45.900Z",
      });

      expect(result.createdCandidates).toEqual([
        {
          intervalIndex: 1,
          scheduledFor:
            "2026-08-01T00:01:30.500Z",
        },
        {
          intervalIndex: 2,
          scheduledFor:
            "2026-08-01T00:03:00.500Z",
        },
        {
          intervalIndex: 3,
          scheduledFor:
            "2026-08-01T00:04:30.500Z",
        },
        {
          intervalIndex: 4,
          scheduledFor:
            "2026-08-01T00:06:00.500Z",
        },
      ]);
      expect(result.nextScheduledFor).toBe(
        "2026-08-01T00:07:30.500Z",
      );
    });

    it("returns not due when the anchor is in the future", () => {
      const result = calculate({
        anchor:
          "2026-08-02T00:00:00.000Z",
        materializedAt:
          "2026-08-01T00:00:00.000Z",
      });

      expect(result.createdCandidates).toEqual(
        [],
      );
      expect(result.nextScheduledFor).toBe(
        "2026-08-02T01:00:00.000Z",
      );
      expect(result.decision).toBe(
        "not_due",
      );
    });

    it("creates only the most recent bounded catch-up window", () => {
      const result = calculate({
        materializedAt:
          "2026-08-01T10:30:00.000Z",
        maximumCatchUpOccurrences: 3,
      });

      expect(result.skippedIntervals).toBe(7);
      expect(result.createdCandidates).toEqual([
        {
          intervalIndex: 8,
          scheduledFor:
            "2026-08-01T08:00:00.000Z",
        },
        {
          intervalIndex: 9,
          scheduledFor:
            "2026-08-01T09:00:00.000Z",
        },
        {
          intervalIndex: 10,
          scheduledFor:
            "2026-08-01T10:00:00.000Z",
        },
      ]);
      expect(result.nextScheduledFor).toBe(
        "2026-08-01T11:00:00.000Z",
      );
    });

    it("applies catch-up only after the latest represented interval", () => {
      const result = calculate({
        materializedAt:
          "2026-08-01T10:30:00.000Z",
        latestScheduledFor:
          "2026-08-01T06:00:00.000Z",
        maximumCatchUpOccurrences: 3,
      });

      expect(result.skippedIntervals).toBe(1);
      expect(result.createdCandidates).toEqual([
        {
          intervalIndex: 8,
          scheduledFor:
            "2026-08-01T08:00:00.000Z",
        },
        {
          intervalIndex: 9,
          scheduledFor:
            "2026-08-01T09:00:00.000Z",
        },
        {
          intervalIndex: 10,
          scheduledFor:
            "2026-08-01T10:00:00.000Z",
        },
      ]);
    });

    it("uses elapsed duration across daylight-saving boundaries", () => {
      const result = calculate({
        anchor:
          "2026-11-01T05:30:00.000Z",
        intervalSeconds: 3600,
        materializedAt:
          "2026-11-01T07:30:00.000Z",
      });

      expect(result.createdCandidates).toEqual([
        {
          intervalIndex: 1,
          scheduledFor:
            "2026-11-01T06:30:00.000Z",
        },
        {
          intervalIndex: 2,
          scheduledFor:
            "2026-11-01T07:30:00.000Z",
        },
      ]);
      expect(result.nextScheduledFor).toBe(
        "2026-11-01T08:30:00.000Z",
      );
    });

    it("rejects intervals below the schedule minimum", () => {
      expect(() =>
        calculate({
          intervalSeconds: 59,
        }),
      ).toThrow(
        "intervalSeconds must be a safe integer greater than or equal to 60",
      );
    });

    it("rejects invalid timestamps", () => {
      expect(() =>
        calculate({
          anchor: "not-a-timestamp",
        }),
      ).toThrow(
        "anchor must be a valid timestamp",
      );

      expect(() =>
        calculate({
          materializedAt:
            "not-a-timestamp",
        }),
      ).toThrow(
        "materializedAt must be a valid timestamp",
      );
    });

    it("rejects latest represented timestamps that do not align with the interval", () => {
      expect(() =>
        calculate({
          latestScheduledFor:
            "2026-08-01T01:30:00.000Z",
        }),
      ).toThrow(
        "latestScheduledFor must align with the deterministic interval sequence",
      );
    });

    it("rejects latest represented timestamps at or before the anchor", () => {
      expect(() =>
        calculate({
          latestScheduledFor:
            "2026-08-01T00:00:00.000Z",
        }),
      ).toThrow(
        "latestScheduledFor must be later than anchor",
      );
    });

    it("rejects catch-up limits outside the contracted range", () => {
      expect(() =>
        calculate({
          maximumCatchUpOccurrences: 0,
        }),
      ).toThrow(
        "maximumCatchUpOccurrences must be an integer between 1 and 100",
      );

      expect(() =>
        calculate({
          maximumCatchUpOccurrences: 101,
        }),
      ).toThrow(
        "maximumCatchUpOccurrences must be an integer between 1 and 100",
      );
    });

    it("returns defensive result collections", () => {
      const first = calculate({
        materializedAt:
          "2026-08-01T01:00:00.000Z",
      });

      first.createdCandidates.push({
        intervalIndex: 99,
        scheduledFor:
          "2026-12-01T00:00:00.000Z",
      });

      const second = calculate({
        materializedAt:
          "2026-08-01T01:00:00.000Z",
      });

      expect(second.createdCandidates).toHaveLength(
        1,
      );
    });
  },
);
