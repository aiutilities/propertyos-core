import {
  describe,
  expect,
  it,
} from "@jest/globals";

import {
  SchedulerHandlerAlreadyRegisteredError,
  SchedulerHandlerNotFoundError,
} from "../errors/scheduler-handler.error";
import {
  SchedulerJob,
  SchedulerJobHandler,
} from "../types/scheduler.types";
import {
  SchedulerHandlerRegistry,
} from "./scheduler-handler.registry";

const handler = (
  jobType: string,
): SchedulerJobHandler => ({
  jobType,
  handle: async (
    _job: SchedulerJob,
  ) => undefined,
});

describe(
  "SchedulerHandlerRegistry",
  () => {
    it("registers and resolves a handler", () => {
      const registry =
        new SchedulerHandlerRegistry();
      const registered =
        handler("report.export");

      registry.register(registered);

      expect(
        registry.resolve(
          "report.export",
        ),
      ).toBe(registered);
    });

    it("fails closed for an unknown job type", () => {
      const registry =
        new SchedulerHandlerRegistry();

      expect(() =>
        registry.resolve(
          "unknown.job",
        ),
      ).toThrow(
        SchedulerHandlerNotFoundError,
      );
    });

    it("treats same-instance registration as idempotent", () => {
      const registry =
        new SchedulerHandlerRegistry();
      const registered =
        handler("report.export");

      registry.register(registered);
      registry.register(registered);

      expect(registry.list()).toEqual([
        "report.export",
      ]);
    });

    it("rejects conflicting duplicate registration", () => {
      const registry =
        new SchedulerHandlerRegistry();

      registry.register(
        handler("report.export"),
      );

      expect(() =>
        registry.register(
          handler("report.export"),
        ),
      ).toThrow(
        SchedulerHandlerAlreadyRegisteredError,
      );
    });
  },
);
