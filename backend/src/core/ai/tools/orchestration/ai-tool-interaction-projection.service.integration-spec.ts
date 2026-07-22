import { describe, expect, it } from "@jest/globals";

import { AiToolCallBatchResult } from "./ai-tool-call-orchestration.types";
import { AiToolInteractionProjectionService } from "./ai-tool-interaction-projection.service";

function batch(
  records: AiToolCallBatchResult["records"],
): AiToolCallBatchResult {
  const succeededCallCount = records.filter(
    (record) => record.outcome === "SUCCEEDED",
  ).length;

  const failedCallCount = records.filter(
    (record) => record.outcome === "FAILED",
  ).length;

  const skippedCallCount = records.filter(
    (record) => record.outcome === "SKIPPED",
  ).length;

  return {
    records,
    evidence: {
      requestedCallCount: records.length,
      executedCallCount: succeededCallCount + failedCallCount,
      succeededCallCount,
      failedCallCount,
      skippedCallCount,
      maximumCalls: 8,
      continueOnFailure: false,
      stoppedEarly: skippedCallCount > 0,
      durationMs: 1,
    },
  };
}

describe("AiToolInteractionProjectionService", () => {
  const service = new AiToolInteractionProjectionService();

  it("projects successful execution into a provider-neutral tool message", () => {
    const result = service.project({
      batchResult: batch([
        {
          callId: "call-success",
          toolId: "property.lookup",
          sequence: 1,
          outcome: "SUCCEEDED",
          result: {
            success: true,
            output: {
              propertyId: "property-1",
              name: "Advaith Nest",
            },
            durationMs: 7,
          },
        },
      ]),
    });

    expect(result.messages).toEqual([
      {
        role: "tool",
        toolCallId: "call-success",
        toolName: "property.lookup",
        content: JSON.stringify({
          success: true,
          outcome: "SUCCEEDED",
          output: {
            propertyId: "property-1",
            name: "Advaith Nest",
          },
          durationMs: 7,
        }),
      },
    ]);

    expect(result.evidence).toEqual({
      requestedRecordCount: 1,
      projectedMessageCount: 1,
      omittedSkippedCount: 0,
      includeSkippedCalls: false,
    });
  });

  it("projects failed execution without losing deterministic error details", () => {
    const result = service.project({
      batchResult: batch([
        {
          callId: "call-failure",
          toolId: "tenant.lookup",
          sequence: 1,
          outcome: "FAILED",
          result: {
            success: false,
            errorCode: "AI_TOOL_PERMISSION_DENIED",
            errorMessage: "Permission denied",
            durationMs: 3,
            retryable: false,
          },
        },
      ]),
    });

    expect(JSON.parse(result.messages[0].content)).toEqual({
      success: false,
      outcome: "FAILED",
      errorCode: "AI_TOOL_PERMISSION_DENIED",
      errorMessage: "Permission denied",
      retryable: false,
      durationMs: 3,
    });
  });

  it("omits skipped calls by default", () => {
    const result = service.project({
      batchResult: batch([
        {
          callId: "call-skipped",
          toolId: "lease.lookup",
          sequence: 1,
          outcome: "SKIPPED",
          skipReason: "Batch stopped",
        },
      ]),
    });

    expect(result.messages).toEqual([]);

    expect(result.evidence).toEqual({
      requestedRecordCount: 1,
      projectedMessageCount: 0,
      omittedSkippedCount: 1,
      includeSkippedCalls: false,
    });
  });

  it("projects skipped calls when explicitly enabled", () => {
    const result = service.project({
      batchResult: batch([
        {
          callId: "call-skipped",
          toolId: "lease.lookup",
          sequence: 1,
          outcome: "SKIPPED",
          skipReason: "Maximum tool-call count exceeded: 1",
        },
      ]),
      includeSkippedCalls: true,
    });

    expect(result.messages).toHaveLength(1);

    expect(result.messages[0]).toEqual({
      role: "tool",
      toolCallId: "call-skipped",
      toolName: "lease.lookup",
      content: JSON.stringify({
        success: false,
        outcome: "SKIPPED",
        errorCode: "AI_TOOL_CALL_SKIPPED",
        errorMessage: "Maximum tool-call count exceeded: 1",
        retryable: false,
      }),
    });
  });

  it("preserves execution order", () => {
    const result = service.project({
      batchResult: batch([
        {
          callId: "call-1",
          toolId: "tool.one",
          sequence: 1,
          outcome: "SUCCEEDED",
          result: {
            success: true,
            output: "one",
            durationMs: 1,
          },
        },
        {
          callId: "call-2",
          toolId: "tool.two",
          sequence: 2,
          outcome: "SUCCEEDED",
          result: {
            success: true,
            output: "two",
            durationMs: 1,
          },
        },
      ]),
    });

    expect(result.messages.map((message) => message.toolCallId)).toEqual([
      "call-1",
      "call-2",
    ]);
  });

  it("rejects executed records without results", () => {
    expect(() =>
      service.project({
        batchResult: batch([
          {
            callId: "call-invalid",
            toolId: "tool.invalid",
            sequence: 1,
            outcome: "SUCCEEDED",
          },
        ]),
      }),
    ).toThrow("Executed tool-call record has no result: call-invalid");
  });

  it("rejects missing projection input", () => {
    expect(() => service.project(undefined as never)).toThrow(
      "AI tool interaction projection input is required",
    );
  });
});
