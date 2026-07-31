import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  Pool,
} from "pg";

import {
  PostgresAiScheduleRepository,
} from "./postgres-ai-schedule.repository";

import {
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";

const createOccurrence = (
  overrides: Partial<AiScheduledOccurrence> = {},
): AiScheduledOccurrence => ({
  id: "11111111-1111-4111-8111-111111111111",
  scheduleId: "daily-summary",
  sequence: 1,
  scheduledFor: "2026-08-01T01:00:00.000Z",
  status: "pending",
  attemptCount: 0,
  createdAt: "2026-08-01T01:00:00.000Z",
  updatedAt: "2026-08-01T01:00:00.000Z",
  ...overrides,
});

const toRow = (
  occurrence: AiScheduledOccurrence,
): Record<string, unknown> => ({
  id: occurrence.id,
  schedule_id: occurrence.scheduleId,
  sequence: occurrence.sequence,
  scheduled_for: occurrence.scheduledFor,
  status: occurrence.status,
  attempt_count: occurrence.attemptCount,
  next_attempt_at: occurrence.nextAttemptAt ?? null,
  worker_id: occurrence.workerId ?? null,
  claimed_at: occurrence.claimedAt ?? null,
  claim_expires_at: occurrence.claimExpiresAt ?? null,
  started_at: occurrence.startedAt ?? null,
  completed_at: occurrence.completedAt ?? null,
  outcome: occurrence.outcome ?? null,
  error_code: occurrence.errorCode ?? null,
  error_message: occurrence.errorMessage ?? null,
  created_at: occurrence.createdAt,
  updated_at: occurrence.updatedAt,
});

interface QueryResponse {
  rows: Record<string, unknown>[];
}

type QueryFunction = (
  query: string,
  values?: unknown[],
) => Promise<QueryResponse>;

type QueryMock = jest.MockedFunction<QueryFunction>;

const repositoryWithQuery = (
  query: QueryMock,
): PostgresAiScheduleRepository =>
  new PostgresAiScheduleRepository(
    { query } as unknown as Pool,
  );

describe(
  "PostgresAiScheduleRepository createOrResolveOccurrence",
  () => {
    it("returns created true when the logical occurrence is inserted", async () => {
      const occurrence = createOccurrence();
      const query = (
        jest.fn() as jest.MockedFunction<QueryFunction>
      )
        .mockResolvedValueOnce({
          rows: [toRow(occurrence)],
        });

      await expect(
        repositoryWithQuery(query)
          .createOrResolveOccurrence(
            occurrence,
          ),
      ).resolves.toEqual({
        occurrence,
        created: true,
      });

      expect(
        String(query.mock.calls[0][0]),
      ).toContain(
        "ai_schedule_occurrences_time_unique",
      );
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("resolves an existing occurrence without overwriting execution state", async () => {
      const requested = createOccurrence({
        id: "22222222-2222-4222-8222-222222222222",
      });
      const existing = createOccurrence({
        status: "retry_scheduled",
        attemptCount: 2,
        nextAttemptAt: "2026-08-01T01:05:00.000Z",
        errorCode: "PROVIDER_TIMEOUT",
        updatedAt: "2026-08-01T01:02:00.000Z",
      });
      const query = (
        jest.fn() as jest.MockedFunction<QueryFunction>
      )
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [toRow(existing)],
        });

      await expect(
        repositoryWithQuery(query)
          .createOrResolveOccurrence(
            requested,
          ),
      ).resolves.toEqual({
        occurrence: existing,
        created: false,
      });

      expect(query).toHaveBeenCalledTimes(2);
      expect(query.mock.calls[1][1]).toEqual([
        requested.scheduleId,
        requested.scheduledFor,
      ]);
    });

    it("supports concurrent logical resolution with one durable occurrence", async () => {
      const first = createOccurrence();
      const second = createOccurrence({
        id: "33333333-3333-4333-8333-333333333333",
      });
      const durable = toRow(first);
      const query = (
        jest.fn() as jest.MockedFunction<QueryFunction>
      )
        .mockResolvedValueOnce({ rows: [durable] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [durable] });
      const repository = repositoryWithQuery(query);

      await expect(
        Promise.all([
          repository.createOrResolveOccurrence(first),
          repository.createOrResolveOccurrence(second),
        ]),
      ).resolves.toEqual([
        { occurrence: first, created: true },
        { occurrence: first, created: false },
      ]);
    });

    it("propagates unrelated database failures", async () => {
      const query = (
        jest.fn() as jest.MockedFunction<QueryFunction>
      )
        .mockRejectedValueOnce(
          new Error("database unavailable"),
        );

      await expect(
        repositoryWithQuery(query)
          .createOrResolveOccurrence(
            createOccurrence(),
          ),
      ).rejects.toThrow(
        "database unavailable",
      );
    });

    it("fails closed when a conflict cannot be resolved", async () => {
      const query = (
        jest.fn() as jest.MockedFunction<QueryFunction>
      )
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        repositoryWithQuery(query)
          .createOrResolveOccurrence(
            createOccurrence(),
          ),
      ).rejects.toThrow(
        "AI schedule occurrence conflict could not be resolved",
      );
    });
  },
);
