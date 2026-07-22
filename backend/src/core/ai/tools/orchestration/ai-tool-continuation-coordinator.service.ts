import { Injectable } from "@nestjs/common";

import { AiToolCallCoordinatorService } from "./ai-tool-call-coordinator.service";
import { AiToolContinuationBoundaryService } from "./ai-tool-continuation-boundary.service";
import { AiToolContinuationDispatchService } from "./ai-tool-continuation-dispatch.service";
import { AiToolContinuationExecutionService } from "./ai-tool-continuation-execution.service";
import {
  AiToolContinuationCoordinatorEvidence,
  AiToolContinuationCoordinatorInput,
  AiToolContinuationCoordinatorResult,
} from "./ai-tool-continuation-coordinator.types";
import { AiToolInteractionProjectionService } from "./ai-tool-interaction-projection.service";

@Injectable()
export class AiToolContinuationCoordinatorService {
  constructor(
    private readonly toolCallCoordinator: AiToolCallCoordinatorService,
    private readonly interactionProjection: AiToolInteractionProjectionService,
    private readonly continuationBoundary: AiToolContinuationBoundaryService,
    private readonly continuationDispatch: AiToolContinuationDispatchService,
    private readonly continuationExecution: AiToolContinuationExecutionService,
  ) {}

  async execute(
    input: AiToolContinuationCoordinatorInput,
  ): Promise<AiToolContinuationCoordinatorResult> {
    this.assertInput(input);
    this.assertParentIdentity(input);

    const batch = await this.toolCallCoordinator.executeBatch({
      calls: input.calls,
      context: input.toolContext,
      ...(input.maximumCalls === undefined
        ? {}
        : {
            maximumCalls: input.maximumCalls,
          }),
      ...(input.continueOnFailure === undefined
        ? {}
        : {
            continueOnFailure: input.continueOnFailure,
          }),
    });

    const projection = this.interactionProjection.project({
      batchResult: batch,
      ...(input.includeSkippedCalls === undefined
        ? {}
        : {
            includeSkippedCalls: input.includeSkippedCalls,
          }),
    });

    if (projection.messages.length === 0) {
      throw new Error(
        "AI tool continuation coordinator produced no projected messages",
      );
    }

    const continuation = this.continuationBoundary.create({
      request: input.parentEnvelope.request,
      projection,
    });

    const continuationDispatch = this.continuationDispatch.create({
      parentEnvelope: input.parentEnvelope,
      continuation,
      ...(input.dispatchedAt === undefined
        ? {}
        : {
            dispatchedAt: input.dispatchedAt,
          }),
      ...(input.metadata === undefined
        ? {}
        : {
            metadata: input.metadata,
          }),
    });

    const continuationExecution = await this.continuationExecution.execute({
      parentContext: input.parentContext,
      continuationDispatch,
      ...(input.startedAt === undefined
        ? {}
        : {
            startedAt: input.startedAt,
          }),
      ...(input.executionId === undefined
        ? {}
        : {
            executionId: input.executionId,
          }),
      ...(input.metadata === undefined
        ? {}
        : {
            metadata: input.metadata,
          }),
    });

    this.assertResultIdentity(
      input,
      continuationDispatch.envelope.requestId,
      continuationExecution.context.requestId,
      continuationExecution.context.correlationId,
    );

    const evidence: AiToolContinuationCoordinatorEvidence = Object.freeze({
      requestId: continuationExecution.context.requestId,
      correlationId: continuationExecution.context.correlationId,
      parentDispatchId: input.parentEnvelope.dispatchId,
      continuationDispatchId: continuationDispatch.envelope.dispatchId,
      parentExecutionId: input.parentContext.executionId,
      continuationExecutionId: continuationExecution.context.executionId,
      requestedCallCount: input.calls.length,
      executedCallCount: batch.evidence.executedCallCount,
      succeededCallCount: batch.evidence.succeededCallCount,
      failedCallCount: batch.evidence.failedCallCount,
      skippedCallCount: batch.evidence.skippedCallCount,
      projectedMessageCount: projection.evidence.projectedMessageCount,
      originalMessageCount: input.parentEnvelope.request.messages.length,
      continuationMessageCount:
        continuationDispatch.envelope.request.messages.length,
      continuationAttempt: continuationExecution.context.attempt,
      outcome: "SUCCEEDED",
    });

    return Object.freeze({
      batch,
      projection,
      continuation,
      continuationDispatch,
      continuationExecution,
      evidence,
    });
  }

  private assertInput(input: AiToolContinuationCoordinatorInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool continuation coordinator input is required");
    }

    if (!Array.isArray(input.calls) || input.calls.length === 0) {
      throw new Error(
        "AI tool continuation coordinator requires at least one tool call",
      );
    }

    if (
      !input.parentEnvelope ||
      typeof input.parentEnvelope !== "object" ||
      typeof input.parentEnvelope.dispatchId !== "string" ||
      !input.parentEnvelope.dispatchId.trim() ||
      typeof input.parentEnvelope.requestId !== "string" ||
      !input.parentEnvelope.requestId.trim() ||
      !input.parentEnvelope.request ||
      typeof input.parentEnvelope.request !== "object" ||
      !Array.isArray(input.parentEnvelope.request.messages)
    ) {
      throw new Error(
        "AI tool continuation coordinator requires a parent envelope",
      );
    }

    if (
      !input.parentContext ||
      typeof input.parentContext !== "object" ||
      typeof input.parentContext.requestId !== "string" ||
      !input.parentContext.requestId.trim() ||
      typeof input.parentContext.correlationId !== "string" ||
      !input.parentContext.correlationId.trim() ||
      typeof input.parentContext.executionId !== "string" ||
      !input.parentContext.executionId.trim()
    ) {
      throw new Error(
        "AI tool continuation coordinator requires a parent execution context",
      );
    }

    if (
      !input.toolContext ||
      typeof input.toolContext !== "object" ||
      typeof input.toolContext.actorId !== "string" ||
      !input.toolContext.actorId.trim() ||
      !Array.isArray(input.toolContext.permissions)
    ) {
      throw new Error(
        "AI tool continuation coordinator requires a tool execution context",
      );
    }
  }

  private assertParentIdentity(
    input: AiToolContinuationCoordinatorInput,
  ): void {
    if (
      input.parentEnvelope.requestId !== input.parentEnvelope.request.requestId
    ) {
      throw new Error("Parent dispatch request identity is inconsistent");
    }

    if (input.parentEnvelope.requestId !== input.parentContext.requestId) {
      throw new Error(
        "Parent dispatch and execution request identities do not match",
      );
    }
  }

  private assertResultIdentity(
    input: AiToolContinuationCoordinatorInput,
    dispatchRequestId: string,
    executionRequestId: string,
    executionCorrelationId: string,
  ): void {
    if (
      dispatchRequestId !== input.parentEnvelope.requestId ||
      executionRequestId !== input.parentContext.requestId
    ) {
      throw new Error(
        "Continuation coordinator result request identity is inconsistent",
      );
    }

    if (executionCorrelationId !== input.parentContext.correlationId) {
      throw new Error(
        "Continuation coordinator result correlation identity is inconsistent",
      );
    }
  }
}
