import { describe, expect, it, jest } from "@jest/globals";

import { AiDispatchExecutionCoordinatorService } from "../../dispatch/ai-dispatch-execution-coordinator.service";
import { AiExecutionContextService } from "../../execution/ai-execution-context.service";
import { AiDispatchExecutionResult } from "../../types/ai-dispatch-execution.types";
import { AiExecutionContext } from "../../types/ai-execution-context.types";
import { AiPreparedProviderRequest } from "../../types/ai-request-preparation.types";
import { AiToolContinuationDispatchResult } from "./ai-tool-continuation-dispatch.types";
import { AiToolContinuationExecutionService } from "./ai-tool-continuation-execution.service";

describe("AiToolContinuationExecutionService", () => {
  const executionContext = new AiExecutionContextService();

  const preparedRequest = (): AiPreparedProviderRequest =>
    Object.freeze({
      requestId: "airq_continuation",
      provider: "openai",
      model: "gpt-test",
      messages: Object.freeze([
        Object.freeze({
          role: "USER" as const,
          content: "Find property",
        }),
        Object.freeze({
          role: "ASSISTANT" as const,
          content: "Calling tool",
        }),
        Object.freeze({
          role: "TOOL" as const,
          content: '{"success":true}',
          metadata: Object.freeze({
            toolCallId: "call-property",
            toolName: "property.lookup",
          }),
        }),
      ]),
      temperature: 0.2,
      topP: 1,
      maxOutputTokens: 1024,
      stopSequences: Object.freeze([]),
      evidence: Object.freeze({
        requestId: "airq_continuation",
        provider: "openai",
        model: "gpt-test",
        messageCount: 3,
        systemPromptPresent: false,
        temperature: 0.2,
        topP: 1,
        maxOutputTokens: 1024,
        stopSequenceCount: 0,
        preparedAt: "2026-07-22T00:00:00.000Z",
        normalizations: Object.freeze(["continuation:tool-messages-appended"]),
      }),
    });

  const parentContext = (): AiExecutionContext =>
    Object.freeze({
      tenantId: "tenant-1",
      requestId: "airq_continuation",
      correlationId: "correlation-1",
      executionId: "execution-parent",
      attempt: 1,
      capability: "CHAT",
      classification: "INTERNAL",
      executionMode: "SYNC" as unknown as AiExecutionContext["executionMode"],
      timeoutMs: 30000,
      metadata: Object.freeze({
        orchestration: "test",
      }),
      timestamps: Object.freeze({
        createdAt: "2026-07-22T00:00:00.000Z",
        startedAt: "2026-07-22T00:00:00.000Z",
      }),
    });

  const continuationDispatch = (): AiToolContinuationDispatchResult =>
    Object.freeze({
      envelope: Object.freeze({
        dispatchId: "aidp_continuation",
        requestId: "airq_continuation",
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "OPENAI_COMPATIBLE",
        model: "gpt-test",
        request: preparedRequest(),
        targetMetadata: Object.freeze({
          providerId: "propertyos.openai",
        }),
        metadata: Object.freeze({
          continuation: true,
          parentDispatchId: "aidp_parent",
        }),
        evidence: Object.freeze({
          dispatchId: "aidp_continuation",
          requestId: "airq_continuation",
          provider: "openai",
          runtimeProvider: "openai-runtime",
          protocol: "OPENAI_COMPATIBLE",
          model: "gpt-test",
          messageCount: 3,
          maxOutputTokens: 1024,
          dispatchedAt: "2026-07-22T00:00:01.000Z",
          validations: Object.freeze([]),
          normalizations: Object.freeze([]),
        }),
      }),
      evidence: Object.freeze({
        requestId: "airq_continuation",
        parentDispatchId: "aidp_parent",
        continuationDispatchId: "aidp_continuation",
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "OPENAI_COMPATIBLE",
        model: "gpt-test",
        originalMessageCount: 2,
        continuationMessageCount: 3,
        toolCallIds: Object.freeze(["call-property"]),
      }),
    });

  const successfulExecution = (
    executionId: string,
  ): AiDispatchExecutionResult =>
    Object.freeze({
      executionId,
      dispatchId: "aidp_continuation",
      requestId: "airq_continuation",
      provider: "openai",
      model: "gpt-test",
      response: Object.freeze({
        providerName: "openai",
        content: "Property found",
        model: "gpt-test",
      }),
      metadata: Object.freeze({
        continuation: true,
      }),
      evidence: Object.freeze({
        executionId,
        dispatchId: "aidp_continuation",
        requestId: "airq_continuation",
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "OPENAI_COMPATIBLE",
        model: "gpt-test",
        messageCount: 3,
        outcome: "SUCCEEDED",
        startedAt: "2026-07-22T00:00:02.000Z",
        completedAt: "2026-07-22T00:00:03.000Z",
        durationMs: 1000,
        providerResolved: true,
        providerInvoked: true,
        validations: Object.freeze(["provider:invoked"]),
      }),
    });

  const createFixture = () => {
    const execute = jest.fn(
      async (
        input: Parameters<AiDispatchExecutionCoordinatorService["execute"]>[0],
      ) => successfulExecution(input.context.executionId),
    );

    const coordinator = {
      execute,
    } as unknown as AiDispatchExecutionCoordinatorService;

    return {
      service: new AiToolContinuationExecutionService(
        executionContext,
        coordinator,
      ),
      execute,
    };
  };

  it("creates a child continuation execution context", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
      startedAt: "2026-07-22T00:00:02.000Z",
    });

    expect(result.context.executionId).toBe("execution-continuation");

    expect(result.context.executionId).not.toBe("execution-parent");
  });

  it("preserves request and correlation identities", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
    });

    expect(result.context.requestId).toBe("airq_continuation");

    expect(result.context.correlationId).toBe("correlation-1");
  });

  it("increments the parent execution attempt", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
    });

    expect(result.context.attempt).toBe(2);
  });

  it("preserves execution governance settings", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
    });

    expect(result.context).toEqual(
      expect.objectContaining({
        tenantId: "tenant-1",
        capability: "CHAT",
        classification: "INTERNAL",
        executionMode: "SYNC" as unknown as AiExecutionContext["executionMode"],
        timeoutMs: 30000,
      }),
    );
  });

  it("records continuation execution lineage metadata", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
    });

    expect(result.context.metadata).toEqual(
      expect.objectContaining({
        continuation: true,
        parentExecutionId: "execution-parent",
        sourceRequestId: "airq_continuation",
        sourceCorrelationId: "correlation-1",
        parentDispatchId: "aidp_parent",
        continuationDispatchId: "aidp_continuation",
        parentAttempt: 1,
        continuationAttempt: 2,
        continuationToolCallIds: ["call-property"],
      }),
    );
  });

  it("delegates only the continuation envelope and child context", async () => {
    const fixture = createFixture();

    const dispatch = continuationDispatch();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: dispatch,
      executionId: "execution-continuation",
    });

    expect(fixture.execute).toHaveBeenCalledTimes(1);

    expect(fixture.execute).toHaveBeenCalledWith({
      envelope: dispatch.envelope,
      context: result.context,
    });
  });

  it("creates immutable continuation execution evidence", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
    });

    expect(result.evidence).toEqual({
      requestId: "airq_continuation",
      correlationId: "correlation-1",
      parentExecutionId: "execution-parent",
      continuationExecutionId: "execution-continuation",
      parentDispatchId: "aidp_parent",
      continuationDispatchId: "aidp_continuation",
      parentAttempt: 1,
      continuationAttempt: 2,
      provider: "openai",
      model: "gpt-test",
      messageCount: 3,
      outcome: "SUCCEEDED",
    });

    expect(Object.isFrozen(result.evidence)).toBe(true);
  });

  it("merges caller metadata over inherited metadata", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
      metadata: {
        continuationReason: "TOOLS_COMPLETED",
        orchestration: "continuation",
      },
    });

    expect(result.context.metadata).toEqual(
      expect.objectContaining({
        continuationReason: "TOOLS_COMPLETED",
        orchestration: "continuation",
      }),
    );
  });

  it("rejects a continuation request identity mismatch", async () => {
    const fixture = createFixture();

    const dispatch = continuationDispatch();

    await expect(
      fixture.service.execute({
        parentContext: parentContext(),
        continuationDispatch: Object.freeze({
          ...dispatch,
          envelope: Object.freeze({
            ...dispatch.envelope,
            requestId: "airq_other",
            request: Object.freeze({
              ...dispatch.envelope.request,
              requestId: "airq_other",
            }),
          }),
        }),
        executionId: "execution-continuation",
      }),
    ).rejects.toThrow(
      "Continuation execution request airq_other does not match parent request airq_continuation",
    );

    expect(fixture.execute).not.toHaveBeenCalled();
  });

  it("rejects inconsistent continuation dispatch identity", async () => {
    const fixture = createFixture();

    const dispatch = continuationDispatch();

    await expect(
      fixture.service.execute({
        parentContext: parentContext(),
        continuationDispatch: Object.freeze({
          ...dispatch,
          evidence: Object.freeze({
            ...dispatch.evidence,
            continuationDispatchId: "aidp_other",
          }),
        }),
        executionId: "execution-continuation",
      }),
    ).rejects.toThrow("Continuation dispatch identity is inconsistent");

    expect(fixture.execute).not.toHaveBeenCalled();
  });

  it("rejects reuse of the parent execution identity", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.execute({
        parentContext: parentContext(),
        continuationDispatch: continuationDispatch(),
        executionId: "execution-parent",
      }),
    ).rejects.toThrow(
      "Continuation execution id must differ from the parent execution id",
    );

    expect(fixture.execute).not.toHaveBeenCalled();
  });

  it("rejects an inconsistent execution result", async () => {
    const execute = jest.fn(async () =>
      Object.freeze({
        ...successfulExecution("execution-other"),
        requestId: "airq_other",
      }),
    );

    const service = new AiToolContinuationExecutionService(executionContext, {
      execute,
    } as unknown as AiDispatchExecutionCoordinatorService);

    await expect(
      service.execute({
        parentContext: parentContext(),
        continuationDispatch: continuationDispatch(),
        executionId: "execution-continuation",
      }),
    ).rejects.toThrow(
      "Continuation execution returned an inconsistent request id",
    );
  });

  it("propagates coordinator execution failures", async () => {
    const failure = new Error("Provider execution failed");

    const execute = jest.fn(async () => {
      throw failure;
    });

    const service = new AiToolContinuationExecutionService(executionContext, {
      execute,
    } as unknown as AiDispatchExecutionCoordinatorService);

    await expect(
      service.execute({
        parentContext: parentContext(),
        continuationDispatch: continuationDispatch(),
        executionId: "execution-continuation",
      }),
    ).rejects.toBe(failure);
  });

  it("rejects missing continuation execution input", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.execute(
        undefined as unknown as Parameters<
          AiToolContinuationExecutionService["execute"]
        >[0],
      ),
    ).rejects.toThrow("AI tool continuation execution input is required");
  });

  it("returns frozen result structures", async () => {
    const fixture = createFixture();

    const result = await fixture.service.execute({
      parentContext: parentContext(),
      continuationDispatch: continuationDispatch(),
      executionId: "execution-continuation",
    });

    expect(Object.isFrozen(result)).toBe(true);

    expect(Object.isFrozen(result.context)).toBe(true);

    expect(Object.isFrozen(result.context.metadata)).toBe(true);
  });
});
