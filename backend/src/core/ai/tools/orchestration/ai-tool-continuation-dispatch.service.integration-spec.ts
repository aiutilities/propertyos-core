import { describe, expect, it } from "@jest/globals";

import { AiPreparedRequestDispatchBoundaryService } from "../../dispatch/ai-prepared-request-dispatch-boundary.service";
import { AiPreparedProviderRequest } from "../../types/ai-request-preparation.types";
import { AiToolContinuationBoundaryResult } from "./ai-tool-continuation-boundary.types";
import { AiToolContinuationDispatchService } from "./ai-tool-continuation-dispatch.service";

describe("AiToolContinuationDispatchService", () => {
  const dispatchBoundary = new AiPreparedRequestDispatchBoundaryService();

  const service = new AiToolContinuationDispatchService(dispatchBoundary);

  const originalRequest = (): AiPreparedProviderRequest =>
    Object.freeze({
      requestId: "airq_12345678",
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
      ]),
      temperature: 0.2,
      topP: 1,
      maxOutputTokens: 1024,
      stopSequences: Object.freeze([]),
      evidence: Object.freeze({
        requestId: "airq_12345678",
        provider: "openai",
        model: "gpt-test",
        messageCount: 2,
        systemPromptPresent: false,
        temperature: 0.2,
        topP: 1,
        maxOutputTokens: 1024,
        stopSequenceCount: 0,
        preparedAt: "2026-07-22T00:00:00.000Z",
        normalizations: Object.freeze([]),
      }),
    });

  const parentEnvelope = () =>
    dispatchBoundary.createEnvelope({
      request: originalRequest(),
      target: {
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "OPENAI_COMPATIBLE",
        model: "gpt-test",
        enabled: true,
        metadata: {
          providerId: "propertyos.openai",
        },
      },
      dispatchedAt: "2026-07-22T00:00:00.000Z",
      metadata: {
        correlationId: "correlation-1",
        executionId: "execution-1",
        attempt: 1,
      },
    });

  const continuation = (): AiToolContinuationBoundaryResult =>
    Object.freeze({
      request: Object.freeze({
        ...originalRequest(),
        messages: Object.freeze([
          ...originalRequest().messages,
          Object.freeze({
            role: "TOOL" as const,
            content: JSON.stringify({
              success: true,
              output: {
                propertyId: "property-1",
              },
            }),
            metadata: Object.freeze({
              toolCallId: "call-property",
              toolName: "property.lookup",
            }),
          }),
        ]),
        evidence: Object.freeze({
          ...originalRequest().evidence,
          messageCount: 3,
          normalizations: Object.freeze([
            "continuation:tool-messages-appended",
          ]),
        }),
      }),
      evidence: Object.freeze({
        requestId: "airq_12345678",
        originalMessageCount: 2,
        projectedMessageCount: 1,
        continuationMessageCount: 3,
        toolCallIds: Object.freeze(["call-property"]),
      }),
    });

  it("creates a new continuation dispatch envelope", () => {
    const parent = parentEnvelope();

    const result = service.create({
      parentEnvelope: parent,
      continuation: continuation(),
      dispatchedAt: "2026-07-22T00:00:01.000Z",
    });

    expect(result.envelope.dispatchId).not.toBe(parent.dispatchId);

    expect(result.envelope.request.messages).toHaveLength(3);
  });

  it("preserves the orchestration request identity", () => {
    const result = service.create({
      parentEnvelope: parentEnvelope(),
      continuation: continuation(),
    });

    expect(result.envelope.requestId).toBe("airq_12345678");

    expect(result.envelope.request.requestId).toBe("airq_12345678");
  });

  it("preserves the parent dispatch target", () => {
    const result = service.create({
      parentEnvelope: parentEnvelope(),
      continuation: continuation(),
    });

    expect(result.envelope).toEqual(
      expect.objectContaining({
        provider: "openai",
        runtimeProvider: "openai-runtime",
        protocol: "OPENAI_COMPATIBLE",
        model: "gpt-test",
        targetMetadata: {
          providerId: "propertyos.openai",
        },
      }),
    );
  });

  it("records immutable dispatch lineage metadata", () => {
    const parent = parentEnvelope();

    const result = service.create({
      parentEnvelope: parent,
      continuation: continuation(),
    });

    expect(result.envelope.metadata).toEqual(
      expect.objectContaining({
        continuation: true,
        parentDispatchId: parent.dispatchId,
        sourceRequestId: "airq_12345678",
        continuationToolCallIds: ["call-property"],
        continuationOriginalMessageCount: 2,
        continuationProjectedMessageCount: 1,
        continuationMessageCount: 3,
      }),
    );

    expect(Object.isFrozen(result.envelope.metadata)).toBe(true);
  });

  it("creates continuation dispatch evidence", () => {
    const parent = parentEnvelope();

    const result = service.create({
      parentEnvelope: parent,
      continuation: continuation(),
    });

    expect(result.evidence).toEqual({
      requestId: "airq_12345678",
      parentDispatchId: parent.dispatchId,
      continuationDispatchId: result.envelope.dispatchId,
      provider: "openai",
      runtimeProvider: "openai-runtime",
      protocol: "OPENAI_COMPATIBLE",
      model: "gpt-test",
      originalMessageCount: 2,
      continuationMessageCount: 3,
      toolCallIds: ["call-property"],
    });
  });

  it("produces deterministic continuation dispatch identifiers", () => {
    const parent = parentEnvelope();

    const first = service.create({
      parentEnvelope: parent,
      continuation: continuation(),
      dispatchedAt: "2026-07-22T00:00:01.000Z",
    });

    const second = service.create({
      parentEnvelope: parent,
      continuation: continuation(),
      dispatchedAt: "2026-07-22T00:00:02.000Z",
    });

    expect(first.envelope.dispatchId).toBe(second.envelope.dispatchId);
  });

  it("changes the continuation dispatch id when lineage changes", () => {
    const firstParent = parentEnvelope();

    const secondParent = Object.freeze({
      ...firstParent,
      dispatchId: "aidp_other",
    });

    const first = service.create({
      parentEnvelope: firstParent,
      continuation: continuation(),
    });

    const second = service.create({
      parentEnvelope: secondParent,
      continuation: continuation(),
    });

    expect(first.envelope.dispatchId).not.toBe(second.envelope.dispatchId);
  });

  it("merges caller metadata over inherited metadata", () => {
    const result = service.create({
      parentEnvelope: parentEnvelope(),
      continuation: continuation(),
      metadata: {
        attempt: 2,
        continuationReason: "TOOLS_COMPLETED",
      },
    });

    expect(result.envelope.metadata).toEqual(
      expect.objectContaining({
        correlationId: "correlation-1",
        executionId: "execution-1",
        attempt: 2,
        continuationReason: "TOOLS_COMPLETED",
      }),
    );
  });

  it("rejects a continuation request identity mismatch", () => {
    const value = continuation();

    expect(() =>
      service.create({
        parentEnvelope: parentEnvelope(),
        continuation: Object.freeze({
          ...value,
          request: Object.freeze({
            ...value.request,
            requestId: "airq_different",
          }),
        }),
      }),
    ).toThrow(
      "Continuation request airq_different does not match parent request airq_12345678",
    );
  });

  it("rejects a continuation without additional messages", () => {
    const value = continuation();

    expect(() =>
      service.create({
        parentEnvelope: parentEnvelope(),
        continuation: Object.freeze({
          ...value,
          request: originalRequest(),
        }),
      }),
    ).toThrow("Continuation request must contain additional messages");
  });

  it("rejects missing continuation dispatch input", () => {
    expect(() =>
      service.create(
        undefined as unknown as Parameters<
          AiToolContinuationDispatchService["create"]
        >[0],
      ),
    ).toThrow("AI tool continuation dispatch input is required");
  });

  it("returns frozen result and evidence", () => {
    const result = service.create({
      parentEnvelope: parentEnvelope(),
      continuation: continuation(),
    });

    expect(Object.isFrozen(result)).toBe(true);

    expect(Object.isFrozen(result.evidence)).toBe(true);

    expect(Object.isFrozen(result.evidence.toolCallIds)).toBe(true);
  });
});
