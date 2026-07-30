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
  AiPlatformScheduleBridgeService,
} from "./ai-platform-schedule-bridge.service";

describe(
  "AiPlatformScheduleBridgeService",
  () => {
    it(
      "creates one platform scheduler job per occurrence",
      async () => {
        const createJob =
          jest.fn<
            SchedulerService["createJob"]
          >();

        const schedulerService = {
          createJob,
        } as unknown as
          SchedulerService;

        const service =
          new AiPlatformScheduleBridgeService(
            schedulerService,
          );

        await service.enqueueOccurrence({
          id: "occurrence-1",
          scheduleId:
            "property.daily.summary",
          sequence: 1,
          scheduledFor:
            "2026-08-01T08:00:00.000Z",
          status: "pending",
          attemptCount: 0,
          createdAt:
            "2026-07-30T12:00:00.000Z",
          updatedAt:
            "2026-07-30T12:00:00.000Z",
        });

        expect(createJob)
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
              "2026-08-01T08:00:00.000Z",
            maxAttempts: 1,
          });
      },
    );
  },
);
