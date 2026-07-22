import { Injectable } from "@nestjs/common";

import { AiPreparedRequestDispatchBoundaryService } from "../../dispatch/ai-prepared-request-dispatch-boundary.service";
import { AiPreparedRequestDispatchEnvelope } from "../../types/ai-prepared-request-dispatch.types";
import {
  AiToolContinuationDispatchEvidence,
  AiToolContinuationDispatchInput,
  AiToolContinuationDispatchResult,
} from "./ai-tool-continuation-dispatch.types";

@Injectable()
export class AiToolContinuationDispatchService {
  constructor(
    private readonly dispatchBoundary: AiPreparedRequestDispatchBoundaryService = new AiPreparedRequestDispatchBoundaryService(),
  ) {}

  create(
    input: AiToolContinuationDispatchInput,
  ): AiToolContinuationDispatchResult {
    this.assertInput(input);

    const parentEnvelope = input.parentEnvelope;

    const continuation = input.continuation;

    this.assertIdentity(parentEnvelope, continuation.request.requestId);

    this.assertContinuationGrowth(
      parentEnvelope,
      continuation.request.messages.length,
    );

    const lineageMetadata = this.deepFreeze(
      this.deepClone({
        ...(parentEnvelope.metadata ?? {}),
        ...(input.metadata ?? {}),
        continuation: true,
        parentDispatchId: parentEnvelope.dispatchId,
        sourceRequestId: parentEnvelope.requestId,
        continuationToolCallIds: continuation.evidence.toolCallIds,
        continuationOriginalMessageCount:
          continuation.evidence.originalMessageCount,
        continuationProjectedMessageCount:
          continuation.evidence.projectedMessageCount,
        continuationMessageCount:
          continuation.evidence.continuationMessageCount,
      }),
    );

    const envelope = this.dispatchBoundary.createEnvelope({
      request: continuation.request,
      target: {
        provider: parentEnvelope.provider,
        runtimeProvider: parentEnvelope.runtimeProvider,
        protocol: parentEnvelope.protocol,
        model: parentEnvelope.model,
        enabled: true,
        ...(parentEnvelope.targetMetadata === undefined
          ? {}
          : {
              metadata: parentEnvelope.targetMetadata,
            }),
      },
      ...(input.dispatchedAt === undefined
        ? {}
        : {
            dispatchedAt: input.dispatchedAt,
          }),
      metadata: lineageMetadata,
    });

    if (envelope.dispatchId === parentEnvelope.dispatchId) {
      throw new Error(
        "Continuation dispatch id must differ from the parent dispatch id",
      );
    }

    const evidence: AiToolContinuationDispatchEvidence = Object.freeze({
      requestId: envelope.requestId,
      parentDispatchId: parentEnvelope.dispatchId,
      continuationDispatchId: envelope.dispatchId,
      provider: envelope.provider,
      runtimeProvider: envelope.runtimeProvider,
      protocol: envelope.protocol,
      model: envelope.model,
      originalMessageCount: parentEnvelope.request.messages.length,
      continuationMessageCount: envelope.request.messages.length,
      toolCallIds: Object.freeze([...continuation.evidence.toolCallIds]),
    });

    return Object.freeze({
      envelope,
      evidence,
    });
  }

  private assertInput(input: AiToolContinuationDispatchInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool continuation dispatch input is required");
    }

    const parent = input.parentEnvelope;

    if (
      !parent ||
      typeof parent !== "object" ||
      typeof parent.dispatchId !== "string" ||
      !parent.dispatchId.trim() ||
      typeof parent.requestId !== "string" ||
      !parent.requestId.trim() ||
      typeof parent.provider !== "string" ||
      !parent.provider.trim() ||
      typeof parent.runtimeProvider !== "string" ||
      !parent.runtimeProvider.trim() ||
      typeof parent.protocol !== "string" ||
      !parent.protocol.trim() ||
      typeof parent.model !== "string" ||
      !parent.model.trim() ||
      !parent.request ||
      typeof parent.request !== "object" ||
      !Array.isArray(parent.request.messages)
    ) {
      throw new Error(
        "AI tool continuation dispatch requires a valid parent envelope",
      );
    }

    const continuation = input.continuation;

    if (
      !continuation ||
      typeof continuation !== "object" ||
      !continuation.request ||
      typeof continuation.request !== "object" ||
      !Array.isArray(continuation.request.messages) ||
      !continuation.evidence ||
      typeof continuation.evidence !== "object" ||
      !Array.isArray(continuation.evidence.toolCallIds)
    ) {
      throw new Error(
        "AI tool continuation dispatch requires a continuation result",
      );
    }
  }

  private assertIdentity(
    parent: AiPreparedRequestDispatchEnvelope,
    continuationRequestId: string,
  ): void {
    if (parent.requestId !== parent.request.requestId) {
      throw new Error("Parent dispatch request identity is inconsistent");
    }

    if (continuationRequestId !== parent.requestId) {
      throw new Error(
        `Continuation request ${continuationRequestId} does not match parent request ${parent.requestId}`,
      );
    }
  }

  private assertContinuationGrowth(
    parent: AiPreparedRequestDispatchEnvelope,
    continuationMessageCount: number,
  ): void {
    if (continuationMessageCount <= parent.request.messages.length) {
      throw new Error("Continuation request must contain additional messages");
    }
  }

  private deepClone<T>(value: T): T {
    if (value === undefined || value === null) {
      return value;
    }

    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }

  private deepFreeze<T>(value: T): T {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);

    for (const nested of Object.values(value as Record<string, unknown>)) {
      this.deepFreeze(nested);
    }

    return value;
  }
}
