import { Injectable } from "@nestjs/common";

import { AiDispatchExecutionCoordinatorService } from "../../dispatch/ai-dispatch-execution-coordinator.service";
import { AiExecutionContextService } from "../../execution/ai-execution-context.service";
import { AiExecutionContext } from "../../types/ai-execution-context.types";
import {
  AiToolContinuationExecutionEvidence,
  AiToolContinuationExecutionInput,
  AiToolContinuationExecutionResult,
} from "./ai-tool-continuation-execution.types";

@Injectable()
export class AiToolContinuationExecutionService {
  constructor(
    private readonly executionContext: AiExecutionContextService,
    private readonly executionCoordinator: AiDispatchExecutionCoordinatorService,
  ) {}

  async execute(
    input: AiToolContinuationExecutionInput,
  ): Promise<AiToolContinuationExecutionResult> {
    this.assertInput(input);

    const parentContext = input.parentContext;

    const continuationDispatch = input.continuationDispatch;

    const envelope = continuationDispatch.envelope;

    this.assertIdentity(parentContext, envelope.requestId);

    this.assertDispatchLineage(
      continuationDispatch.evidence.parentDispatchId,
      envelope.dispatchId,
      continuationDispatch.evidence.continuationDispatchId,
    );

    const continuationAttempt = parentContext.attempt + 1;

    const metadata = this.deepFreeze(
      this.deepClone({
        ...parentContext.metadata,
        ...(input.metadata ?? {}),
        continuation: true,
        parentExecutionId: parentContext.executionId,
        sourceRequestId: parentContext.requestId,
        sourceCorrelationId: parentContext.correlationId,
        parentDispatchId: continuationDispatch.evidence.parentDispatchId,
        continuationDispatchId: envelope.dispatchId,
        parentAttempt: parentContext.attempt,
        continuationAttempt,
        continuationToolCallIds: continuationDispatch.evidence.toolCallIds,
      }),
    );

    const context = this.executionContext.create({
      tenantId: parentContext.tenantId,
      requestId: parentContext.requestId,
      correlationId: parentContext.correlationId,
      ...(input.executionId === undefined
        ? {}
        : {
            executionId: input.executionId,
          }),
      attempt: continuationAttempt,
      capability: parentContext.capability,
      classification: parentContext.classification,
      executionMode: parentContext.executionMode,
      timeoutMs: parentContext.timeoutMs,
      metadata,
      timestamps: {
        createdAt: input.startedAt ?? new Date().toISOString(),
        startedAt: input.startedAt ?? new Date().toISOString(),
      },
    });

    if (context.executionId === parentContext.executionId) {
      throw new Error(
        "Continuation execution id must differ from the parent execution id",
      );
    }

    const execution = await this.executionCoordinator.execute({
      envelope,
      context,
    });

    this.assertExecutionResult(
      execution.requestId,
      execution.dispatchId,
      execution.executionId,
      envelope.requestId,
      envelope.dispatchId,
      context.executionId,
    );

    const evidence: AiToolContinuationExecutionEvidence = Object.freeze({
      requestId: context.requestId,
      correlationId: context.correlationId,
      parentExecutionId: parentContext.executionId,
      continuationExecutionId: execution.executionId,
      parentDispatchId: continuationDispatch.evidence.parentDispatchId,
      continuationDispatchId: execution.dispatchId,
      parentAttempt: parentContext.attempt,
      continuationAttempt: context.attempt,
      provider: execution.provider,
      model: execution.model,
      messageCount: envelope.request.messages.length,
      outcome: "SUCCEEDED",
    });

    return Object.freeze({
      context,
      execution,
      evidence,
    });
  }

  private assertInput(input: AiToolContinuationExecutionInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool continuation execution input is required");
    }

    const parent = input.parentContext;

    if (
      !parent ||
      typeof parent !== "object" ||
      typeof parent.tenantId !== "string" ||
      !parent.tenantId.trim() ||
      typeof parent.requestId !== "string" ||
      !parent.requestId.trim() ||
      typeof parent.correlationId !== "string" ||
      !parent.correlationId.trim() ||
      typeof parent.executionId !== "string" ||
      !parent.executionId.trim() ||
      !Number.isInteger(parent.attempt) ||
      parent.attempt <= 0 ||
      !Number.isInteger(parent.timeoutMs) ||
      parent.timeoutMs <= 0 ||
      !parent.metadata ||
      typeof parent.metadata !== "object"
    ) {
      throw new Error(
        "AI tool continuation execution requires a valid parent context",
      );
    }

    const dispatch = input.continuationDispatch;

    if (
      !dispatch ||
      typeof dispatch !== "object" ||
      !dispatch.envelope ||
      typeof dispatch.envelope !== "object" ||
      !dispatch.evidence ||
      typeof dispatch.evidence !== "object"
    ) {
      throw new Error(
        "AI tool continuation execution requires a continuation dispatch",
      );
    }
  }

  private assertIdentity(
    parent: AiExecutionContext,
    continuationRequestId: string,
  ): void {
    if (parent.requestId !== continuationRequestId) {
      throw new Error(
        `Continuation execution request ${continuationRequestId} does not match parent request ${parent.requestId}`,
      );
    }
  }

  private assertDispatchLineage(
    parentDispatchId: string,
    envelopeDispatchId: string,
    evidenceDispatchId: string,
  ): void {
    if (typeof parentDispatchId !== "string" || !parentDispatchId.trim()) {
      throw new Error("Continuation execution requires a parent dispatch id");
    }

    if (envelopeDispatchId !== evidenceDispatchId) {
      throw new Error("Continuation dispatch identity is inconsistent");
    }

    if (envelopeDispatchId === parentDispatchId) {
      throw new Error(
        "Continuation dispatch must differ from the parent dispatch",
      );
    }
  }

  private assertExecutionResult(
    resultRequestId: string,
    resultDispatchId: string,
    resultExecutionId: string,
    expectedRequestId: string,
    expectedDispatchId: string,
    expectedExecutionId: string,
  ): void {
    if (resultRequestId !== expectedRequestId) {
      throw new Error(
        "Continuation execution returned an inconsistent request id",
      );
    }

    if (resultDispatchId !== expectedDispatchId) {
      throw new Error(
        "Continuation execution returned an inconsistent dispatch id",
      );
    }

    if (resultExecutionId !== expectedExecutionId) {
      throw new Error(
        "Continuation execution returned an inconsistent execution id",
      );
    }
  }

  private deepClone<T>(value: T): T {
    if (value === null || typeof value !== "object") {
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

    Object.values(value as Record<string, unknown>).forEach((nested) => {
      this.deepFreeze(nested);
    });

    return Object.freeze(value);
  }
}
