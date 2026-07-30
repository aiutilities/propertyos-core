import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  SchedulerHandlerRegistry,
} from "../../../scheduler/registries/scheduler-handler.registry";

import {
  SchedulerJob,
} from "../../../scheduler/types/scheduler.types";

import {
  AiScheduleLifecycleService,
} from "../execution/ai-schedule-lifecycle.service";

import {
  AiScheduledOccurrenceExecutionService,
} from "../execution/ai-scheduled-occurrence-execution.service";

import {
  AiScheduleOccurrenceJobHandler,
} from "./ai-schedule-occurrence-job.handler";

const createJob = (
  payload: Record<string, unknown> = {
    occurrenceId:
      "occurrence-1",
  },
): SchedulerJob =>
  ({
    id: "scheduler-job-1",
    jobType:
      "AI_SCHEDULE_OCCURRENCE_EXECUTION",
    payload,
  }) as SchedulerJob;

describe(
  "AiScheduleOccurrenceJobHandler",
  () => {
    const createHarness = () => {
      const register =
        jest.fn();

      const claimOccurrence =
        jest.fn<
          AiScheduleLifecycleService[
            "claimOccurrence"
          ]
        >();

      const executeOccurrence =
        jest.fn<
          AiScheduledOccurrenceExecutionService[
            "executeOccurrence"
          ]
        >();

      const handler =
        new AiScheduleOccurrenceJobHandler(
          {
            register,
          } as unknown as
            SchedulerHandlerRegistry,
          {
            claimOccurrence,
          } as unknown as
            AiScheduleLifecycleService,
          {
            executeOccurrence,
          } as unknown as
            AiScheduledOccurrenceExecutionService,
        );

      return {
        register,
        claimOccurrence,
        executeOccurrence,
        handler,
      };
    };

    it(
      "registers with the platform scheduler",
      () => {
        const {
          handler,
          register,
        } = createHarness();

        handler.onModuleInit();

        expect(register)
          .toHaveBeenCalledWith(
            handler,
          );

        expect(handler.jobType)
          .toBe(
            "AI_SCHEDULE_OCCURRENCE_EXECUTION",
          );
      },
    );

    it(
      "claims before dispatching the occurrence",
      async () => {
        const {
          claimOccurrence,
          executeOccurrence,
          handler,
        } = createHarness();

        const order: string[] = [];

        claimOccurrence
          .mockImplementation(
            async () => {
              order.push("claim");

              return {} as never;
            },
          );

        executeOccurrence
          .mockImplementation(
            async () => {
              order.push("execute");

              return {} as never;
            },
          );

        await handler.handle(
          createJob(),
        );

        expect(order)
          .toEqual([
            "claim",
            "execute",
          ]);

        expect(
          claimOccurrence,
        ).toHaveBeenCalledWith(
          "occurrence-1",
          "platform-scheduler:scheduler-job-1",
          expect.any(String),
          expect.any(String),
        );

        expect(
          executeOccurrence,
        ).toHaveBeenCalledWith({
          occurrenceId:
            "occurrence-1",
          workerId:
            "platform-scheduler:scheduler-job-1",
          executedAt:
            expect.any(String),
        });
      },
    );

    it(
      "rejects missing occurrence identity",
      async () => {
        const {
          handler,
          claimOccurrence,
          executeOccurrence,
        } = createHarness();

        await expect(
          handler.handle(
            createJob({}),
          ),
        ).rejects.toThrow(
          "Scheduled AI occurrence job requires occurrenceId",
        );

        expect(
          claimOccurrence,
        ).not.toHaveBeenCalled();

        expect(
          executeOccurrence,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "uses configurable claim TTL",
      async () => {
        const previous =
          process.env
            .AI_SCHEDULE_CLAIM_TTL_MS;

        process.env
          .AI_SCHEDULE_CLAIM_TTL_MS =
          "60000";

        try {
          const {
            handler,
            claimOccurrence,
          } = createHarness();

          await handler.handle(
            createJob(),
          );

          const call =
            claimOccurrence.mock
              .calls[0];

          const claimedAt =
            Date.parse(
              call[2],
            );

          const expiresAt =
            Date.parse(
              call[3],
            );

          expect(
            expiresAt -
              claimedAt,
          ).toBe(60000);
        } finally {
          if (
            previous === undefined
          ) {
            delete process.env
              .AI_SCHEDULE_CLAIM_TTL_MS;
          } else {
            process.env
              .AI_SCHEDULE_CLAIM_TTL_MS =
              previous;
          }
        }
      },
    );
  },
);
