import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  SchedulerService,
} from "../../../scheduler/services/scheduler.service";
import {
  SchedulerJob,
} from "../../../scheduler/types/scheduler.types";
import {
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";
import {
  AiPlatformScheduleBridgeService,
} from "./ai-platform-schedule-bridge.service";

describe(
  "AiPlatformScheduleBridgeService",
  () => {
    it("creates or resolves one scheduler job per occurrence", async () => {
      const createOrResolveJob =
        jest.fn<
          SchedulerService[
            "createOrResolveJob"
          ]
        >();

      createOrResolveJob
        .mockResolvedValue({
          job: {} as SchedulerJob,
          created: true,
        });

      const service =
        new AiPlatformScheduleBridgeService(
          {
            createOrResolveJob,
          } as unknown as
            SchedulerService,
        );

      const occurrence:
        AiScheduledOccurrence = {
          id: "occurrence-1",
          scheduleId:
            "schedule-1",
          sequence: 1,
          scheduledFor:
            "2026-08-01T01:00:00.000Z",
          status: "pending",
          attemptCount: 0,
          createdAt:
            "2026-08-01T00:00:00.000Z",
          updatedAt:
            "2026-08-01T00:00:00.000Z",
        };

      await service.enqueueOccurrence(
        occurrence,
      );

      expect(createOrResolveJob)
        .toHaveBeenCalledWith({
          name:
            "Execute AI schedule occurrence occurrence-1",
          jobType:
            "AI_SCHEDULE_OCCURRENCE_EXECUTION",
          payload: {
            occurrenceId:
              "occurrence-1",
          },
          scheduleType:
            "ONE_TIME",
          runAt:
            "2026-08-01T01:00:00.000Z",
          maxAttempts:
            1,
          idempotencyKey:
            "ai-schedule-occurrence:occurrence-1",
        });
    });
  },
);
