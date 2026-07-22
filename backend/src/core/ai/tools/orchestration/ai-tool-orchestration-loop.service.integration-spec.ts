import { describe, expect, it, jest } from "@jest/globals";

import { AiDispatchExecutionResult } from "../../types/ai-dispatch-execution.types";
import { AiExecutionContext } from "../../types/ai-execution-context.types";
import { AiPreparedRequestDispatchEnvelope } from "../../types/ai-prepared-request-dispatch.types";
import { AiResponse } from "../../types/ai.types";
import { AiToolContinuationCoordinatorService } from "./ai-tool-continuation-coordinator.service";
import { AiToolContinuationCoordinatorResult } from "./ai-tool-continuation-coordinator.types";
import { AiToolOrchestrationDecisionService } from "./ai-tool-orchestration-decision.service";
import { AiToolOrchestrationLoopService } from "./ai-tool-orchestration-loop.service";
import { AiToolResponseNormalizationService } from "./ai-tool-response-normalization.service";

describe("AiToolOrchestrationLoopService", () => {
  const requestId = "airq_loop";
  const correlationId = "aicr_loop";

  const response = (
    content: string,
    toolCalls: readonly {
      readonly id: string;
      readonly name: string;
      readonly input: string;
    }[] = [],
  ): AiResponse =>
    Object.freeze({
      providerName: "openai",
      model: "gpt-test",
      content,
      raw: Object.freeze({
        choices: Object.freeze([
          Object.freeze({
            message: Object.freeze({
              role: "assistant",
              content: content || null,
              tool_calls: Object.freeze(
                toolCalls.map((call) =>
                  Object.freeze({
                    id: call.id,
                    type: "function",
                    function: Object.freeze({
                      name: call.name,
                      arguments: call.input,
                    }),
                  }),
                ),
              ),
            }),
          }),
        ]),
      }),
    });

  const envelope = (
    dispatchId: string,
    messageCount: number,
  ): AiPreparedRequestDispatchEnvelope =>
    Object.freeze({
      dispatchId,
      requestId,
      provider: "openai",
      runtimeProvider: "openai-runtime",
      protocol: "OPENAI_COMPATIBLE",
      model: "gpt-test",
      request: Object.freeze({
        requestId,
        provider: "openai",
        model: "gpt-test",
        messages: Object.freeze(
          Array.from(
            {
              length: messageCount,
            },
            (_, index) =>
              Object.freeze({
                role: index === 0 ? ("USER" as const) : ("TOOL" as const),
                content: `message-${index + 1}`,
                ...(index === 0
                  ? {}
                  : {
                      metadata: Object.freeze({
                        toolCallId: `call-${index}`,
                        toolName: "property.lookup",
                      }),
                    }),
              }),
          ),
        ),
        temperature: 0.2,
        topP: 1,
        maxOutputTokens: 1024,
        stopSequences: Object.freeze([]),
        evidence: Object.freeze({
          requestId,
          provider: "openai",
          model: "gpt-test",
          messageCount,
          systemPromptPresent: false,
          temperature: 0.2,
          topP: 1,
          maxOutputTokens: 1024,
          stopSequenceCount: 0,
          preparedAt: "2026-07-22T00:00:00.000Z",
          normalizations: Object.freeze([]),
        }),
      }),
      evidence: Object.freeze({
        dispatchId,
        requestId,
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "OPENAI_COMPATIBLE",
        model: "gpt-test",
        messageCount,
        maxOutputTokens: 1024,
        dispatchedAt: "2026-07-22T00:00:00.000Z",
        validations: Object.freeze([]),
        normalizations: Object.freeze([]),
      }),
    });

  const context = (
    executionId: string,
    attempt: number,
  ): AiExecutionContext =>
    Object.freeze({
      tenantId: "tenant-1",
      requestId,
      correlationId,
      executionId,
      attempt,
      capability: "TOOL_CALLING",
      classification: "INTERNAL",
      executionMode: "SYNC" as unknown as AiExecutionContext["executionMode"],
      timeoutMs: 30000,
      metadata: Object.freeze({
        orchestration: "loop-test",
      }),
      timestamps: Object.freeze({
        createdAt: "2026-07-22T00:00:00.000Z",
        startedAt: "2026-07-22T00:00:00.000Z",
      }),
    });

  const execution = (
    dispatchId: string,
    executionId: string,
    providerResponse: AiResponse,
  ): AiDispatchExecutionResult =>
    Object.freeze({
      executionId,
      dispatchId,
      requestId,
      provider: "openai",
      model: "gpt-test",
      response: providerResponse,
      evidence: Object.freeze({
        executionId,
        dispatchId,
        requestId,
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "OPENAI_COMPATIBLE",
        model: "gpt-test",
        messageCount: 1,
        outcome: "SUCCEEDED",
        startedAt: "2026-07-22T00:00:00.000Z",
        completedAt: "2026-07-22T00:00:01.000Z",
        durationMs: 1000,
        providerResolved: true,
        providerInvoked: true,
        validations: Object.freeze(["provider:invoked"]),
      }),
    });

  const continuationResult = (
    round: number,
    providerResponse: AiResponse,
  ): AiToolContinuationCoordinatorResult => {
    const parentDispatchId =
      round === 1 ? "aidp_initial" : `aidp_round_${round - 1}`;
    const parentExecutionId =
      round === 1 ? "aiex_initial" : `aiex_round_${round - 1}`;
    const continuationDispatchId = `aidp_round_${round}`;
    const continuationExecutionId = `aiex_round_${round}`;

    const continuationEnvelope = envelope(
      continuationDispatchId,
      round + 1,
    );
    const continuationContext = context(
      continuationExecutionId,
      round + 1,
    );
    const continuationExecution = execution(
      continuationDispatchId,
      continuationExecutionId,
      providerResponse,
    );

    return Object.freeze({
      batch: Object.freeze({
        records: Object.freeze([
          Object.freeze({
            callId: `call-${round}`,
            toolId: "property.lookup",
            sequence: 1,
            outcome: "SUCCEEDED" as const,
            result: Object.freeze({
              success: true as const,
              output: Object.freeze({
                propertyId: `property-${round}`,
              }),
              durationMs: 1,
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
          durationMs: 1,
        }),
      }),
      projection: Object.freeze({
        messages: Object.freeze([
          Object.freeze({
            role: "tool" as const,
            content: '{"success":true}',
            toolCallId: `call-${round}`,
            toolName: "property.lookup",
          }),
        ]),
        evidence: Object.freeze({
          requestedRecordCount: 1,
          projectedMessageCount: 1,
          omittedSkippedCount: 0,
          includeSkippedCalls: false,
        }),
      }),
      continuation: Object.freeze({
        request: continuationEnvelope.request,
        evidence: Object.freeze({
          requestId,
          originalMessageCount: round,
          projectedMessageCount: 1,
          continuationMessageCount: round + 1,
          toolCallIds: Object.freeze([`call-${round}`]),
        }),
      }),
      continuationDispatch: Object.freeze({
        envelope: continuationEnvelope,
        evidence: Object.freeze({
          requestId,
          parentDispatchId,
          continuationDispatchId,
          provider: "openai",
          runtimeProvider: "openai-runtime",
          protocol: "OPENAI_COMPATIBLE",
          model: "gpt-test",
          originalMessageCount: round,
          continuationMessageCount: round + 1,
          toolCallIds: Object.freeze([`call-${round}`]),
        }),
      }),
      continuationExecution: Object.freeze({
        context: continuationContext,
        execution: continuationExecution,
        evidence: Object.freeze({
          requestId,
          correlationId,
          parentExecutionId,
          continuationExecutionId,
          parentDispatchId,
          continuationDispatchId,
          parentAttempt: round,
          continuationAttempt: round + 1,
          provider: "openai",
          model: "gpt-test",
          messageCount: round + 1,
          outcome: "SUCCEEDED",
        }),
      }),
      evidence: Object.freeze({
        requestId,
        correlationId,
        parentDispatchId,
        continuationDispatchId,
        parentExecutionId,
        continuationExecutionId,
        requestedCallCount: 1,
        executedCallCount: 1,
        succeededCallCount: 1,
        failedCallCount: 0,
        skippedCallCount: 0,
        projectedMessageCount: 1,
        originalMessageCount: round,
        continuationMessageCount: round + 1,
        continuationAttempt: round + 1,
        outcome: "SUCCEEDED",
      }),
    });
  };

  const createFixture = (
    continuationResponses: readonly AiResponse[],
  ) => {
    let continuationIndex = 0;

    const executeContinuation = jest.fn<
      AiToolContinuationCoordinatorService["execute"]
    >(async () => {
      const next =
        continuationResponses[continuationIndex] ??
        response("Terminal fallback");

      continuationIndex += 1;

      return continuationResult(
        continuationIndex,
        next,
      );
    });

    const service = new AiToolOrchestrationLoopService(
      new AiToolResponseNormalizationService(),
      new AiToolOrchestrationDecisionService(),
      {
        execute: executeContinuation,
      } as unknown as AiToolContinuationCoordinatorService,
    );

    return {
      service,
      executeContinuation,
    };
  };

  const input = (
    initialResponse: AiResponse,
    maximumRounds = 3,
  ) => ({
    initialEnvelope: envelope("aidp_initial", 1),
    initialContext: context("aiex_initial", 1),
    initialExecution: execution(
      "aidp_initial",
      "aiex_initial",
      initialResponse,
    ),
    toolContext: Object.freeze({
      actorId: "actor-1",
      correlationId,
      permissions: Object.freeze(["property.read"]),
      requestId,
    }),
    maximumRounds,
  });

  it("returns immediately for an initial terminal response", async () => {
    const fixture = createFixture([]);

    const result = await fixture.service.execute(
      input(response("Completed")),
    );

    expect(result.outcome).toBe("TERMINAL");
    expect(result.terminal).toBe(true);
    expect(result.exhausted).toBe(false);
    expect(result.response.content).toBe("Completed");
    expect(result.rounds).toHaveLength(1);
    expect(result.evidence.completedContinuationRounds).toBe(0);
    expect(result.evidence.observedResponseCount).toBe(1);
    expect(fixture.executeContinuation).not.toHaveBeenCalled();
  });

  it("executes one continuation and returns its terminal response", async () => {
    const fixture = createFixture([
      response("Property found"),
    ]);

    const result = await fixture.service.execute(
      input(
        response("", [
          {
            id: "call-1",
            name: "property.lookup",
            input: '{"propertyId":"property-1"}',
          },
        ]),
      ),
    );

    expect(result.outcome).toBe("TERMINAL");
    expect(result.response.content).toBe("Property found");
    expect(result.rounds).toHaveLength(2);
    expect(result.evidence.completedContinuationRounds).toBe(1);
    expect(result.evidence.normalizedToolCallCount).toBe(1);
    expect(result.evidence.executedToolCallCount).toBe(1);
    expect(result.evidence.succeededToolCallCount).toBe(1);
    expect(fixture.executeContinuation).toHaveBeenCalledTimes(1);
  });

  it("supports multiple bounded continuation rounds", async () => {
    const fixture = createFixture([
      response("", [
        {
          id: "call-2",
          name: "tenant.lookup",
          input: '{"tenantId":"tenant-1"}',
        },
      ]),
      response("Completed after tools"),
    ]);

    const result = await fixture.service.execute(
      input(
        response("", [
          {
            id: "call-1",
            name: "property.lookup",
            input: '{"propertyId":"property-1"}',
          },
        ]),
        3,
      ),
    );

    expect(result.outcome).toBe("TERMINAL");
    expect(result.response.content).toBe("Completed after tools");
    expect(result.rounds).toHaveLength(3);
    expect(result.evidence.completedContinuationRounds).toBe(2);
    expect(result.evidence.observedResponseCount).toBe(3);
    expect(result.evidence.normalizedToolCallCount).toBe(2);
    expect(result.evidence.executedToolCallCount).toBe(2);
    expect(fixture.executeContinuation).toHaveBeenCalledTimes(2);
  });

  it("returns exhaustion when tool calls remain at the limit", async () => {
    const fixture = createFixture([
      response("", [
        {
          id: "call-2",
          name: "tenant.lookup",
          input: '{"tenantId":"tenant-1"}',
        },
      ]),
    ]);

    const result = await fixture.service.execute(
      input(
        response("", [
          {
            id: "call-1",
            name: "property.lookup",
            input: '{"propertyId":"property-1"}',
          },
        ]),
        1,
      ),
    );

    expect(result.outcome).toBe("EXHAUSTED");
    expect(result.terminal).toBe(false);
    expect(result.exhausted).toBe(true);
    expect(result.rounds).toHaveLength(2);
    expect(result.evidence.completedContinuationRounds).toBe(1);
    expect(result.evidence.maximumRounds).toBe(1);
    expect(fixture.executeContinuation).toHaveBeenCalledTimes(1);
  });

  it("passes bounded execution options into every continuation", async () => {
    const fixture = createFixture([
      response("Completed"),
    ]);

    await fixture.service.execute({
      ...input(
        response("", [
          {
            id: "call-1",
            name: "property.lookup",
            input: '{"propertyId":"property-1"}',
          },
        ]),
      ),
      maximumCallsPerRound: 4,
      continueOnFailure: true,
      includeSkippedCalls: true,
      metadata: Object.freeze({
        phase: "19C3D",
      }),
    });

    expect(fixture.executeContinuation).toHaveBeenCalledWith(
      expect.objectContaining({
        maximumCalls: 4,
        continueOnFailure: true,
        includeSkippedCalls: true,
        metadata: expect.objectContaining({
          phase: "19C3D",
          orchestrationLoop: true,
          orchestrationRound: 1,
          maximumOrchestrationRounds: 3,
        }),
      }),
    );
  });

  it("creates immutable loop results and evidence", async () => {
    const fixture = createFixture([]);

    const result = await fixture.service.execute(
      input(response("Completed")),
    );

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.rounds)).toBe(true);
    expect(Object.isFrozen(result.rounds[0])).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);
  });

  it("rejects mismatched initial request identities", async () => {
    const fixture = createFixture([]);
    const request = input(response("Completed"));

    await expect(
      fixture.service.execute({
        ...request,
        initialContext: Object.freeze({
          ...request.initialContext,
          requestId: "airq_other",
        }),
      }),
    ).rejects.toThrow(
      "Initial dispatch, context, and execution request identities do not match",
    );

    expect(fixture.executeContinuation).not.toHaveBeenCalled();
  });

  it("rejects mismatched initial dispatch identities", async () => {
    const fixture = createFixture([]);
    const request = input(response("Completed"));

    await expect(
      fixture.service.execute({
        ...request,
        initialExecution: Object.freeze({
          ...request.initialExecution,
          dispatchId: "aidp_other",
        }),
      }),
    ).rejects.toThrow(
      "Initial dispatch and execution dispatch identities do not match",
    );
  });

  it("rejects invalid maximum round limits", async () => {
    const fixture = createFixture([]);

    await expect(
      fixture.service.execute(
        input(response("Completed"), 0),
      ),
    ).rejects.toThrow(
      "maximumRounds must be an integer between 1 and 16",
    );

    await expect(
      fixture.service.execute(
        input(response("Completed"), 17),
      ),
    ).rejects.toThrow(
      "maximumRounds must be an integer between 1 and 16",
    );
  });

  it("propagates continuation failures without another round", async () => {
    const fixture = createFixture([]);

    fixture.executeContinuation.mockRejectedValueOnce(
      new Error("Continuation execution unavailable"),
    );

    await expect(
      fixture.service.execute(
        input(
          response("", [
            {
              id: "call-1",
              name: "property.lookup",
              input: '{"propertyId":"property-1"}',
            },
          ]),
        ),
      ),
    ).rejects.toThrow(
      "Continuation execution unavailable",
    );

    expect(fixture.executeContinuation).toHaveBeenCalledTimes(1);
  });

  it("rejects missing loop input", async () => {
    const fixture = createFixture([]);

    await expect(
      fixture.service.execute(
        undefined as unknown as Parameters<
          AiToolOrchestrationLoopService["execute"]
        >[0],
      ),
    ).rejects.toThrow(
      "AI tool orchestration loop input is required",
    );
  });
});
