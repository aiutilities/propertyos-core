import { describe, expect, it, jest } from "@jest/globals";
import { AiExecutionContext } from "../../types/ai-execution-context.types";
import { AiPreparedRequestDispatchEnvelope } from "../../types/ai-prepared-request-dispatch.types";
import { AiToolCallCoordinatorService } from "./ai-tool-call-coordinator.service";
import { AiToolCallBatchResult } from "./ai-tool-call-orchestration.types";
import { AiToolContinuationBoundaryService } from "./ai-tool-continuation-boundary.service";
import { AiToolContinuationBoundaryResult } from "./ai-tool-continuation-boundary.types";
import { AiToolContinuationCoordinatorService } from "./ai-tool-continuation-coordinator.service";
import { AiToolContinuationDispatchService } from "./ai-tool-continuation-dispatch.service";
import { AiToolContinuationDispatchResult } from "./ai-tool-continuation-dispatch.types";
import { AiToolContinuationExecutionService } from "./ai-tool-continuation-execution.service";
import { AiToolContinuationExecutionResult } from "./ai-tool-continuation-execution.types";
import { AiToolInteractionProjectionService } from "./ai-tool-interaction-projection.service";
import { AiToolInteractionProjectionResult } from "./ai-tool-interaction-projection.types";

describe("AiToolContinuationCoordinatorService", () => {
  type ToolExecutionContext = Parameters<
    AiToolCallCoordinatorService["executeBatch"]
  >[0]["context"];

  const toolContext = (): ToolExecutionContext =>
    ({
      tenantId: "tenant-test",
      actorId: "actor-test",
      permissions: Object.freeze(["property.read", "ai.tool.execute"]),
      requestId: "airq_parent",
      correlationId: "aicr_parent",
      metadata: Object.freeze({
        source: "phase-19c2-test",
      }),
    }) as unknown as ToolExecutionContext;

  const parentContext = (): AiExecutionContext =>
    ({
      tenantId: "tenant-test",
      requestId: "airq_parent",
      correlationId: "aicr_parent",
      executionId: "aiex_parent",
      attempt: 1,
      capability: "CHAT",
      classification: "INTERNAL",
      executionMode: "SYNC",
      timeoutMs: 30000,
      metadata: Object.freeze({
        orchestration: "test",
      }),
      timestamps: Object.freeze({
        createdAt: "2026-07-22T08:00:00.000Z",
        startedAt: "2026-07-22T08:00:00.000Z",
      }),
    }) as unknown as AiExecutionContext;

  const parentEnvelope = (): AiPreparedRequestDispatchEnvelope =>
    ({
      dispatchId: "aidp_parent",
      requestId: "airq_parent",
      provider: "openai",
      runtimeProvider: "openai-runtime",
      protocol: "openai-compatible",
      model: "gpt-test",
      request: Object.freeze({
        requestId: "airq_parent",
        messages: Object.freeze([
          Object.freeze({
            role: "USER",
            content: "Find the property",
          }),
          Object.freeze({
            role: "ASSISTANT",
            content: "",
          }),
        ]),
        evidence: Object.freeze({
          messageCount: 2,
          normalizations: Object.freeze([]),
        }),
      }),
      metadata: Object.freeze({
        source: "test",
      }),
    }) as unknown as AiPreparedRequestDispatchEnvelope;

  const batchResult = (): AiToolCallBatchResult =>
    Object.freeze({
      records: Object.freeze([
        Object.freeze({
          callId: "call-property",
          toolId: "property.search",
          sequence: 1,
          outcome: "SUCCEEDED",
          result: Object.freeze({
            success: true,
            output: Object.freeze({
              propertyId: "property-1",
            }),
            durationMs: 4,
          }),
        }),
      ]),
      evidence: Object.freeze({
        requestedCallCount: 1,
        executedCallCount: 1,
        succeededCallCount: 1,
        failedCallCount: 0,
        skippedCallCount: 0,
        maximumCalls: 8,
        continueOnFailure: false,
        stoppedEarly: false,
        durationMs: 4,
      }),
    }) as unknown as AiToolCallBatchResult;

  const projectionResult = (): AiToolInteractionProjectionResult =>
    Object.freeze({
      messages: Object.freeze([
        Object.freeze({
          role: "tool",
          toolCallId: "call-property",
          toolName: "property.search",
          content: JSON.stringify({
            success: true,
            output: {
              propertyId: "property-1",
            },
          }),
        }),
      ]),
      evidence: Object.freeze({
        requestedRecordCount: 1,
        projectedMessageCount: 1,
        omittedSkippedCount: 0,
        includeSkippedCalls: false,
      }),
    });

  const boundaryResult = (): AiToolContinuationBoundaryResult =>
    ({
      request: Object.freeze({
        ...parentEnvelope().request,
        messages: Object.freeze([
          ...parentEnvelope().request.messages,
          Object.freeze({
            role: "TOOL",
            content: '{"success":true}',
            metadata: Object.freeze({
              toolCallId: "call-property",
              toolName: "property.search",
            }),
          }),
        ]),
      }),
      evidence: Object.freeze({
        requestId: "airq_parent",
        originalMessageCount: 2,
        projectedMessageCount: 1,
        continuationMessageCount: 3,
        toolCallIds: Object.freeze(["call-property"]),
      }),
    }) as unknown as AiToolContinuationBoundaryResult;

  const dispatchResult = (): AiToolContinuationDispatchResult =>
    ({
      envelope: Object.freeze({
        ...parentEnvelope(),
        dispatchId: "aidp_continuation",
        request: boundaryResult().request,
      }),
      evidence: Object.freeze({
        requestId: "airq_parent",
        parentDispatchId: "aidp_parent",
        continuationDispatchId: "aidp_continuation",
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "openai-compatible",
        model: "gpt-test",
        originalMessageCount: 2,
        continuationMessageCount: 3,
        toolCallIds: Object.freeze(["call-property"]),
      }),
    }) as unknown as AiToolContinuationDispatchResult;

  const executionResult = (): AiToolContinuationExecutionResult =>
    ({
      context: Object.freeze({
        ...parentContext(),
        executionId: "aiex_continuation",
        attempt: 2,
      }),
      execution: Object.freeze({
        requestId: "airq_parent",
        dispatchId: "aidp_continuation",
        executionId: "aiex_continuation",
        provider: "openai",
        model: "gpt-test",
        response: Object.freeze({
          providerName: "openai",
          model: "gpt-test",
          content: "Property found",
        }),
      }),
      evidence: Object.freeze({
        requestId: "airq_parent",
        correlationId: "aicr_parent",
        parentExecutionId: "aiex_parent",
        continuationExecutionId: "aiex_continuation",
        parentDispatchId: "aidp_parent",
        continuationDispatchId: "aidp_continuation",
        parentAttempt: 1,
        continuationAttempt: 2,
        provider: "openai",
        model: "gpt-test",
        messageCount: 3,
        outcome: "SUCCEEDED",
      }),
    }) as unknown as AiToolContinuationExecutionResult;

  const createFixture = () => {
    const executeBatch = jest.fn<AiToolCallCoordinatorService["executeBatch"]>(
      async (_input) => batchResult(),
    );
    const project = jest.fn<AiToolInteractionProjectionService["project"]>(
      (_input) => projectionResult(),
    );
    const createBoundary = jest.fn<AiToolContinuationBoundaryService["create"]>(
      (_input) => boundaryResult(),
    );
    const createDispatch = jest.fn<AiToolContinuationDispatchService["create"]>(
      (_input) => dispatchResult(),
    );
    const executeContinuation = jest.fn<
      AiToolContinuationExecutionService["execute"]
    >(async (_input) => executionResult());

    const service = new AiToolContinuationCoordinatorService(
      {
        executeBatch,
      } as unknown as AiToolCallCoordinatorService,
      {
        project,
      } as unknown as AiToolInteractionProjectionService,
      {
        create: createBoundary,
      } as unknown as AiToolContinuationBoundaryService,
      {
        create: createDispatch,
      } as unknown as AiToolContinuationDispatchService,
      {
        execute: executeContinuation,
      } as unknown as AiToolContinuationExecutionService,
    );

    return {
      service,
      executeBatch,
      project,
      createBoundary,
      createDispatch,
      executeContinuation,
    };
  };

  const input = () => ({
    calls: [
      {
        callId: "call-property",
        toolId: "property.search",
        input: {
          query: "Chennai",
        },
      },
    ],
    parentEnvelope: parentEnvelope(),
    parentContext: parentContext(),
    toolContext: toolContext(),
    maximumCalls: 4,
    continueOnFailure: true,
    includeSkippedCalls: true,
    dispatchedAt: "2026-07-22T08:01:00.000Z",
    startedAt: "2026-07-22T08:01:01.000Z",
    executionId: "aiex_continuation",
    metadata: Object.freeze({
      phase: "19C2",
    }),
  });

  it("coordinates one complete continuation cycle", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute(input());

    expect(result.batch.evidence.succeededCallCount).toBe(1);
    expect(result.projection.messages).toHaveLength(1);
    expect(result.continuation.evidence.continuationMessageCount).toBe(3);
    expect(result.continuationDispatch.envelope.dispatchId).toBe(
      "aidp_continuation",
    );
    expect(result.continuationExecution.context.executionId).toBe(
      "aiex_continuation",
    );
  });

  it("delegates tool execution using the parent context", async () => {
    const fixture = createFixture();
    const request = input();

    await fixture.service.execute(request);

    expect(fixture.executeBatch).toHaveBeenCalledTimes(1);

    const executionInput = fixture.executeBatch.mock.calls[0][0];

    expect(executionInput.calls).toBe(request.calls);
    expect(executionInput.context).toBe(request.toolContext);
    expect(executionInput.maximumCalls).toBe(4);
    expect(executionInput.continueOnFailure).toBe(true);
  });

  it("projects the completed tool-call batch", async () => {
    const fixture = createFixture();

    await fixture.service.execute(input());

    expect(fixture.project).toHaveBeenCalledTimes(1);

    const projectionInput = fixture.project.mock.calls[0][0];

    expect(projectionInput.batchResult).toEqual(batchResult());
    expect(projectionInput.includeSkippedCalls).toBe(true);
  });

  it("creates the continuation from the parent prepared request", async () => {
    const fixture = createFixture();
    const request = input();

    await fixture.service.execute(request);

    expect(fixture.createBoundary).toHaveBeenCalledTimes(1);

    const boundaryInput = fixture.createBoundary.mock.calls[0][0];

    expect(boundaryInput.request).toBe(request.parentEnvelope.request);
    expect(boundaryInput.projection).toEqual(projectionResult());
  });

  it("creates a child dispatch from the parent envelope", async () => {
    const fixture = createFixture();
    const request = input();

    await fixture.service.execute(request);

    expect(fixture.createDispatch).toHaveBeenCalledTimes(1);

    const dispatchInput = fixture.createDispatch.mock.calls[0][0];

    expect(dispatchInput.parentEnvelope).toBe(request.parentEnvelope);
    expect(dispatchInput.continuation).toEqual(boundaryResult());
    expect(dispatchInput.dispatchedAt).toBe(request.dispatchedAt);
    expect(dispatchInput.metadata).toBe(request.metadata);
  });

  it("executes the continuation using the parent execution context", async () => {
    const fixture = createFixture();
    const request = input();

    await fixture.service.execute(request);

    expect(fixture.executeContinuation).toHaveBeenCalledTimes(1);

    const continuationExecutionInput =
      fixture.executeContinuation.mock.calls[0][0];

    expect(continuationExecutionInput.parentContext).toBe(
      request.parentContext,
    );
    expect(continuationExecutionInput.continuationDispatch).toEqual(
      dispatchResult(),
    );
    expect(continuationExecutionInput.startedAt).toBe(request.startedAt);
    expect(continuationExecutionInput.executionId).toBe(request.executionId);
    expect(continuationExecutionInput.metadata).toBe(request.metadata);
  });

  it("creates immutable orchestration evidence", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute(input());

    expect(result.evidence).toEqual({
      requestId: "airq_parent",
      correlationId: "aicr_parent",
      parentDispatchId: "aidp_parent",
      continuationDispatchId: "aidp_continuation",
      parentExecutionId: "aiex_parent",
      continuationExecutionId: "aiex_continuation",
      requestedCallCount: 1,
      executedCallCount: 1,
      succeededCallCount: 1,
      failedCallCount: 0,
      skippedCallCount: 0,
      projectedMessageCount: 1,
      originalMessageCount: 2,
      continuationMessageCount: 3,
      continuationAttempt: 2,
      outcome: "SUCCEEDED",
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);
  });

  it("rejects mismatched parent request identities", async () => {
    const fixture = createFixture();
    const request = input();

    await expect(
      fixture.service.execute({
        ...request,
        parentContext: {
          ...request.parentContext,
          requestId: "airq_other",
        },
      }),
    ).rejects.toThrow(
      "Parent dispatch and execution request identities do not match",
    );

    expect(fixture.executeBatch).not.toHaveBeenCalled();
  });

  it("rejects a cycle with no projected messages", async () => {
    const fixture = createFixture();

    fixture.project.mockReturnValueOnce({
      messages: Object.freeze([]),
      evidence: Object.freeze({
        requestedRecordCount: 1,
        projectedMessageCount: 0,
        omittedSkippedCount: 1,
        includeSkippedCalls: false,
      }),
    });

    await expect(fixture.service.execute(input())).rejects.toThrow(
      "AI tool continuation coordinator produced no projected messages",
    );

    expect(fixture.createBoundary).not.toHaveBeenCalled();
  });

  it("propagates tool-call execution failures", async () => {
    const fixture = createFixture();

    fixture.executeBatch.mockRejectedValueOnce(
      new Error("Tool execution unavailable"),
    );

    await expect(fixture.service.execute(input())).rejects.toThrow(
      "Tool execution unavailable",
    );

    expect(fixture.project).not.toHaveBeenCalled();
  });

  it("rejects missing coordinator input", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.execute(
        undefined as unknown as Parameters<
          AiToolContinuationCoordinatorService["execute"]
        >[0],
      ),
    ).rejects.toThrow("AI tool continuation coordinator input is required");
  });
});
