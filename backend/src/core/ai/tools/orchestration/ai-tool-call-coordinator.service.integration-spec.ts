import { describe, expect, it, jest } from "@jest/globals";

import { AiToolExecutionService } from "../execution/ai-tool-execution.service";
import {
  AiToolExecutionContext,
  AiToolExecutionResult,
  AiToolInvocation,
} from "../types/ai-tool.types";
import { AiToolCallCoordinatorService } from "./ai-tool-call-coordinator.service";

function createContext(): AiToolExecutionContext {
  return {
    actorId: "actor-19c1a",
    correlationId: "correlation-19c1a",
    permissions: ["property.read"],
    propertyId: "property-19c1a",
  };
}

function success(output: string): AiToolExecutionResult {
  return {
    success: true,
    output,
    durationMs: 1,
  };
}

function failure(code = "AI_TOOL_EXECUTION_FAILED"): AiToolExecutionResult {
  return {
    success: false,
    errorCode: code,
    errorMessage: "Tool execution failed",
    durationMs: 1,
    retryable: false,
  };
}

function createService(results: readonly AiToolExecutionResult[]) {
  let index = 0;

  const execute = jest.fn<
    (invocation: AiToolInvocation) => Promise<AiToolExecutionResult>
  >(async () => {
    const result = results[index] ?? success("default");

    index += 1;

    return result;
  });

  const executionService = {
    execute,
  } as unknown as AiToolExecutionService;

  return {
    execute,
    service: new AiToolCallCoordinatorService(executionService),
  };
}

describe("AiToolCallCoordinatorService", () => {
  it("executes calls sequentially and preserves order", async () => {
    const { service, execute } = createService([
      success("first-result"),
      success("second-result"),
    ]);

    const result = await service.executeBatch({
      calls: [
        {
          callId: "call-1",
          toolId: "property.lookup",
          input: {
            propertyId: "property-1",
          },
        },
        {
          callId: "call-2",
          toolId: "tenant.lookup",
          input: {
            tenantId: "tenant-1",
          },
        },
      ],
      context: createContext(),
    });

    expect(execute).toHaveBeenCalledTimes(2);

    expect(execute.mock.calls[0][0]).toEqual({
      toolId: "property.lookup",
      input: {
        propertyId: "property-1",
      },
      context: createContext(),
    });

    expect(
      result.records.map((record) => ({
        callId: record.callId,
        sequence: record.sequence,
        outcome: record.outcome,
      })),
    ).toEqual([
      {
        callId: "call-1",
        sequence: 1,
        outcome: "SUCCEEDED",
      },
      {
        callId: "call-2",
        sequence: 2,
        outcome: "SUCCEEDED",
      },
    ]);

    expect(result.evidence).toEqual(
      expect.objectContaining({
        requestedCallCount: 2,
        executedCallCount: 2,
        succeededCallCount: 2,
        failedCallCount: 0,
        skippedCallCount: 0,
        maximumCalls: 8,
        continueOnFailure: false,
        stoppedEarly: false,
      }),
    );
  });

  it("stops after failure by default", async () => {
    const { service, execute } = createService([
      failure(),
      success("not-executed"),
    ]);

    const result = await service.executeBatch({
      calls: [
        {
          callId: "call-1",
          toolId: "property.lookup",
          input: null,
        },
        {
          callId: "call-2",
          toolId: "tenant.lookup",
          input: null,
        },
      ],
      context: createContext(),
    });

    expect(execute).toHaveBeenCalledTimes(1);

    expect(result.records).toEqual([
      expect.objectContaining({
        callId: "call-1",
        outcome: "FAILED",
      }),
      expect.objectContaining({
        callId: "call-2",
        outcome: "SKIPPED",
        skipReason: "Tool-call batch stopped after a previous failure",
      }),
    ]);

    expect(result.evidence).toEqual(
      expect.objectContaining({
        executedCallCount: 1,
        failedCallCount: 1,
        skippedCallCount: 1,
        stoppedEarly: true,
      }),
    );
  });

  it("continues after failure when explicitly enabled", async () => {
    const { service, execute } = createService([
      failure(),
      success("continued"),
    ]);

    const result = await service.executeBatch({
      calls: [
        {
          callId: "call-1",
          toolId: "tool.one",
          input: null,
        },
        {
          callId: "call-2",
          toolId: "tool.two",
          input: null,
        },
      ],
      context: createContext(),
      continueOnFailure: true,
    });

    expect(execute).toHaveBeenCalledTimes(2);

    expect(result.records.map((record) => record.outcome)).toEqual([
      "FAILED",
      "SUCCEEDED",
    ]);

    expect(result.evidence).toEqual(
      expect.objectContaining({
        executedCallCount: 2,
        succeededCallCount: 1,
        failedCallCount: 1,
        stoppedEarly: false,
        continueOnFailure: true,
      }),
    );
  });

  it("skips duplicate call identifiers", async () => {
    const { service, execute } = createService([success("first")]);

    const result = await service.executeBatch({
      calls: [
        {
          callId: "same-call",
          toolId: "tool.one",
          input: null,
        },
        {
          callId: "same-call",
          toolId: "tool.two",
          input: null,
        },
      ],
      context: createContext(),
    });

    expect(execute).toHaveBeenCalledTimes(1);

    expect(result.records[1]).toEqual(
      expect.objectContaining({
        outcome: "SKIPPED",
        skipReason: "Duplicate tool-call identifier: same-call",
      }),
    );
  });

  it("enforces the requested maximum call count", async () => {
    const { service, execute } = createService([success("first")]);

    const result = await service.executeBatch({
      calls: [
        {
          callId: "call-1",
          toolId: "tool.one",
          input: null,
        },
        {
          callId: "call-2",
          toolId: "tool.two",
          input: null,
        },
      ],
      context: createContext(),
      maximumCalls: 1,
    });

    expect(execute).toHaveBeenCalledTimes(1);

    expect(result.records[1]).toEqual(
      expect.objectContaining({
        outcome: "SKIPPED",
        skipReason: "Maximum tool-call count exceeded: 1",
      }),
    );

    expect(result.evidence).toEqual(
      expect.objectContaining({
        requestedCallCount: 2,
        executedCallCount: 1,
        skippedCallCount: 1,
        maximumCalls: 1,
      }),
    );
  });

  it.each([0, -1, 33, 1.5])(
    "rejects invalid maximumCalls value %s",
    async (maximumCalls) => {
      const { service, execute } = createService([]);

      await expect(
        service.executeBatch({
          calls: [
            {
              callId: "call-1",
              toolId: "tool.one",
              input: null,
            },
          ],
          context: createContext(),
          maximumCalls,
        }),
      ).rejects.toThrow("maximumCalls must be an integer between 1 and 32");

      expect(execute).not.toHaveBeenCalled();
    },
  );

  it("rejects an empty batch", async () => {
    const { service, execute } = createService([]);

    await expect(
      service.executeBatch({
        calls: [],
        context: createContext(),
      }),
    ).rejects.toThrow("AI tool-call batch requires at least one call");

    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects calls without identifiers", async () => {
    const { service, execute } = createService([]);

    await expect(
      service.executeBatch({
        calls: [
          {
            callId: " ",
            toolId: "tool.one",
            input: null,
          },
        ],
        context: createContext(),
      }),
    ).rejects.toThrow("AI tool call 0 requires a callId");

    expect(execute).not.toHaveBeenCalled();
  });
});
