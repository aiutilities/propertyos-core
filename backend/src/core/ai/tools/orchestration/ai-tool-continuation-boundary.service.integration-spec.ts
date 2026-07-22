import { describe, expect, it } from "@jest/globals";

import { AiPreparedProviderRequest } from "../../types/ai-request-preparation.types";
import { AiToolInteractionProjectionResult } from "./ai-tool-interaction-projection.types";
import { AiToolContinuationBoundaryService } from "./ai-tool-continuation-boundary.service";

describe("AiToolContinuationBoundaryService", () => {
  const service = new AiToolContinuationBoundaryService();

  const request = (): AiPreparedProviderRequest =>
    Object.freeze({
      requestId: "airq_original",
      provider: "openai",
      model: "gpt-test",
      messages: Object.freeze([
        Object.freeze({
          role: "SYSTEM" as const,
          content: "Follow instructions",
        }),
        Object.freeze({
          role: "USER" as const,
          content: "Find the property",
        }),
        Object.freeze({
          role: "ASSISTANT" as const,
          content: "Calling property lookup",
        }),
      ]),
      systemPrompt: "System prompt",
      temperature: 0.2,
      topP: 1,
      maxOutputTokens: 1024,
      stopSequences: Object.freeze(["STOP"]),
      metadata: Object.freeze({
        tenantId: "tenant-1",
      }),
      evidence: Object.freeze({
        requestId: "airq_original",
        provider: "openai",
        model: "gpt-test",
        messageCount: 3,
        systemPromptPresent: true,
        temperature: 0.2,
        topP: 1,
        maxOutputTokens: 1024,
        stopSequenceCount: 1,
        preparedAt: "2026-07-22T00:00:00.000Z",
        normalizations: Object.freeze([]),
      }),
    });

  const projection = (): AiToolInteractionProjectionResult =>
    Object.freeze({
      messages: Object.freeze([
        Object.freeze({
          role: "tool" as const,
          toolCallId: "call-property",
          toolName: "property.lookup",
          content: JSON.stringify({
            success: true,
            outcome: "SUCCEEDED",
            output: {
              propertyId: "property-1",
            },
            durationMs: 4,
          }),
        }),
        Object.freeze({
          role: "tool" as const,
          toolCallId: "call-lease",
          toolName: "lease.lookup",
          content: JSON.stringify({
            success: false,
            outcome: "FAILED",
            errorCode: "AI_TOOL_NOT_FOUND",
            errorMessage: "Lease was not found",
            retryable: false,
            durationMs: 2,
          }),
        }),
      ]),
      evidence: Object.freeze({
        requestedRecordCount: 2,
        projectedMessageCount: 2,
        omittedSkippedCount: 0,
        includeSkippedCalls: false,
      }),
    });

  it("appends projected tool messages after the original conversation", () => {
    const result = service.create({
      request: request(),
      projection: projection(),
    });

    expect(result.request.messages.map((message) => message.role)).toEqual([
      "SYSTEM",
      "USER",
      "ASSISTANT",
      "TOOL",
      "TOOL",
    ]);
  });

  it("preserves projected execution order", () => {
    const result = service.create({
      request: request(),
      projection: projection(),
    });

    expect(
      result.request.messages
        .slice(3)
        .map((message) => message.metadata?.toolCallId),
    ).toEqual(["call-property", "call-lease"]);
  });

  it("preserves provider-neutral tool metadata", () => {
    const result = service.create({
      request: request(),
      projection: projection(),
    });

    expect(result.request.messages[3]).toEqual({
      role: "TOOL",
      content: projection().messages[0].content,
      metadata: {
        toolCallId: "call-property",
        toolName: "property.lookup",
        source: "AI_TOOL_INTERACTION_PROJECTION",
      },
    });
  });

  it("preserves prepared request generation settings", () => {
    const original = request();

    const result = service.create({
      request: original,
      projection: projection(),
    });

    expect(result.request).toEqual(
      expect.objectContaining({
        requestId: original.requestId,
        provider: original.provider,
        model: original.model,
        systemPrompt: original.systemPrompt,
        temperature: original.temperature,
        topP: original.topP,
        maxOutputTokens: original.maxOutputTokens,
        stopSequences: original.stopSequences,
        metadata: original.metadata,
      }),
    );
  });

  it("updates prepared-request evidence for the continuation", () => {
    const result = service.create({
      request: request(),
      projection: projection(),
    });

    expect(result.request.evidence).toEqual(
      expect.objectContaining({
        requestId: "airq_original",
        messageCount: 5,
        normalizations: ["continuation:tool-messages-appended"],
      }),
    );

    expect(result.evidence).toEqual({
      requestId: "airq_original",
      originalMessageCount: 3,
      projectedMessageCount: 2,
      continuationMessageCount: 5,
      toolCallIds: ["call-property", "call-lease"],
    });
  });

  it("does not mutate the original prepared request", () => {
    const original = request();

    const result = service.create({
      request: original,
      projection: projection(),
    });

    expect(result.request).not.toBe(original);
    expect(original.messages).toHaveLength(3);
    expect(original.evidence.messageCount).toBe(3);
    expect(original.evidence.normalizations).toEqual([]);
  });

  it("returns frozen continuation structures", () => {
    const result = service.create({
      request: request(),
      projection: projection(),
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.request)).toBe(true);
    expect(Object.isFrozen(result.request.messages)).toBe(true);
    expect(Object.isFrozen(result.request.messages[3])).toBe(true);
    expect(Object.isFrozen(result.request.messages[3].metadata)).toBe(true);
    expect(Object.isFrozen(result.request.evidence)).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);
    expect(Object.isFrozen(result.evidence.toolCallIds)).toBe(true);
  });

  it("rejects an empty projection", () => {
    expect(() =>
      service.create({
        request: request(),
        projection: Object.freeze({
          ...projection(),
          messages: Object.freeze([]),
        }),
      }),
    ).toThrow(
      "AI tool continuation boundary requires at least one projected message",
    );
  });

  it("rejects projected messages that are not tool messages", () => {
    expect(() =>
      service.create({
        request: request(),
        projection: Object.freeze({
          ...projection(),
          messages: Object.freeze([
            Object.freeze({
              role: "assistant" as const,
              content: "Not a tool message",
            }),
          ]),
        }),
      }),
    ).toThrow("Projected message 0 must use the tool role");
  });

  it("rejects duplicate projected tool-call identifiers", () => {
    const projected = projection();

    expect(() =>
      service.create({
        request: request(),
        projection: Object.freeze({
          ...projected,
          messages: Object.freeze([
            projected.messages[0],
            Object.freeze({
              ...projected.messages[1],
              toolCallId: "call-property",
            }),
          ]),
        }),
      }),
    ).toThrow("Duplicate projected tool-call id: call-property");
  });

  it("rejects missing continuation input", () => {
    expect(() =>
      service.create(
        undefined as unknown as Parameters<
          AiToolContinuationBoundaryService["create"]
        >[0],
      ),
    ).toThrow("AI tool continuation boundary input is required");
  });
});
