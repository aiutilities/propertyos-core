import { Injectable } from "@nestjs/common";

import { AiDispatchExecutionResult } from "../../types/ai-dispatch-execution.types";
import { AiExecutionContext } from "../../types/ai-execution-context.types";
import { AiPreparedRequestDispatchEnvelope } from "../../types/ai-prepared-request-dispatch.types";
import { AiToolContinuationCoordinatorService } from "./ai-tool-continuation-coordinator.service";
import {
  AiToolOrchestrationLoopEvidence,
  AiToolOrchestrationLoopInput,
  AiToolOrchestrationLoopResult,
  AiToolOrchestrationLoopRound,
} from "./ai-tool-orchestration-loop.types";
import { AiToolOrchestrationDecisionService } from "./ai-tool-orchestration-decision.service";
import { AiToolResponseNormalizationService } from "./ai-tool-response-normalization.service";

const HARD_MAXIMUM_ORCHESTRATION_ROUNDS = 16;

@Injectable()
export class AiToolOrchestrationLoopService {
  constructor(
    private readonly responseNormalization: AiToolResponseNormalizationService,
    private readonly orchestrationDecision: AiToolOrchestrationDecisionService,
    private readonly continuationCoordinator: AiToolContinuationCoordinatorService,
  ) {}

  async execute(
    input: AiToolOrchestrationLoopInput,
  ): Promise<AiToolOrchestrationLoopResult> {
    this.assertInput(input);
    this.assertInitialIdentity(input);

    let currentEnvelope = input.initialEnvelope;
    let currentContext = input.initialContext;
    let currentExecution = input.initialExecution;
    let currentRound = 0;

    let normalizedToolCallCount = 0;
    let executedToolCallCount = 0;
    let succeededToolCallCount = 0;
    let failedToolCallCount = 0;
    let skippedToolCallCount = 0;

    const rounds: AiToolOrchestrationLoopRound[] = [];

    while (true) {
      this.assertCurrentIdentity(
        currentEnvelope,
        currentContext,
        currentExecution,
      );

      const normalization = this.responseNormalization.normalize({
        response: currentExecution.response,
      });

      normalizedToolCallCount += normalization.calls.length;

      const decision = this.orchestrationDecision.decide({
        currentRound,
        maximumRounds: input.maximumRounds,
        calls: normalization.calls,
      });

      if (decision.outcome !== "CONTINUE") {
        rounds.push(
          this.freezeRound({
            round: currentRound,
            envelope: currentEnvelope,
            context: currentContext,
            execution: currentExecution,
            normalization,
            decision,
          }),
        );

        return this.createResult({
          input,
          rounds,
          currentEnvelope,
          currentContext,
          currentExecution,
          outcome: decision.outcome,
          currentRound,
          normalizedToolCallCount,
          executedToolCallCount,
          succeededToolCallCount,
          failedToolCallCount,
          skippedToolCallCount,
        });
      }

      const continuation = await this.continuationCoordinator.execute({
        calls: normalization.calls,
        parentEnvelope: currentEnvelope,
        parentContext: currentContext,
        toolContext: input.toolContext,
        ...(input.maximumCallsPerRound === undefined
          ? {}
          : {
              maximumCalls: input.maximumCallsPerRound,
            }),
        ...(input.continueOnFailure === undefined
          ? {}
          : {
              continueOnFailure: input.continueOnFailure,
            }),
        ...(input.includeSkippedCalls === undefined
          ? {}
          : {
              includeSkippedCalls: input.includeSkippedCalls,
            }),
        metadata: Object.freeze({
          ...(input.metadata ?? {}),
          orchestrationLoop: true,
          orchestrationRound: currentRound + 1,
          maximumOrchestrationRounds: input.maximumRounds,
        }),
      });

      executedToolCallCount += continuation.batch.evidence.executedCallCount;
      succeededToolCallCount += continuation.batch.evidence.succeededCallCount;
      failedToolCallCount += continuation.batch.evidence.failedCallCount;
      skippedToolCallCount += continuation.batch.evidence.skippedCallCount;

      rounds.push(
        this.freezeRound({
          round: currentRound,
          envelope: currentEnvelope,
          context: currentContext,
          execution: currentExecution,
          normalization,
          decision,
          continuation,
        }),
      );

      currentEnvelope = continuation.continuationDispatch.envelope;
      currentContext = continuation.continuationExecution.context;
      currentExecution = continuation.continuationExecution.execution;
      currentRound += 1;
    }
  }

  private createResult(input: {
    readonly input: AiToolOrchestrationLoopInput;
    readonly rounds: readonly AiToolOrchestrationLoopRound[];
    readonly currentEnvelope: AiPreparedRequestDispatchEnvelope;
    readonly currentContext: AiExecutionContext;
    readonly currentExecution: AiDispatchExecutionResult;
    readonly outcome: "TERMINAL" | "EXHAUSTED";
    readonly currentRound: number;
    readonly normalizedToolCallCount: number;
    readonly executedToolCallCount: number;
    readonly succeededToolCallCount: number;
    readonly failedToolCallCount: number;
    readonly skippedToolCallCount: number;
  }): AiToolOrchestrationLoopResult {
    const evidence: AiToolOrchestrationLoopEvidence = Object.freeze({
      requestId: input.currentContext.requestId,
      correlationId: input.currentContext.correlationId,
      initialDispatchId: input.input.initialEnvelope.dispatchId,
      initialExecutionId: input.input.initialContext.executionId,
      finalDispatchId: input.currentEnvelope.dispatchId,
      finalExecutionId: input.currentContext.executionId,
      maximumRounds: input.input.maximumRounds,
      completedContinuationRounds: input.currentRound,
      observedResponseCount: input.rounds.length,
      normalizedToolCallCount: input.normalizedToolCallCount,
      executedToolCallCount: input.executedToolCallCount,
      succeededToolCallCount: input.succeededToolCallCount,
      failedToolCallCount: input.failedToolCallCount,
      skippedToolCallCount: input.skippedToolCallCount,
      outcome: input.outcome,
    });

    return Object.freeze({
      outcome: input.outcome,
      terminal: input.outcome === "TERMINAL",
      exhausted: input.outcome === "EXHAUSTED",
      response: input.currentExecution.response,
      envelope: input.currentEnvelope,
      context: input.currentContext,
      execution: input.currentExecution,
      rounds: Object.freeze([...input.rounds]),
      evidence,
    });
  }

  private freezeRound(
    round: AiToolOrchestrationLoopRound,
  ): AiToolOrchestrationLoopRound {
    return Object.freeze({
      ...round,
    });
  }

  private assertInput(input: AiToolOrchestrationLoopInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool orchestration loop input is required");
    }

    if (
      !input.initialEnvelope ||
      typeof input.initialEnvelope !== "object" ||
      typeof input.initialEnvelope.dispatchId !== "string" ||
      !input.initialEnvelope.dispatchId.trim() ||
      typeof input.initialEnvelope.requestId !== "string" ||
      !input.initialEnvelope.requestId.trim()
    ) {
      throw new Error(
        "AI tool orchestration loop requires an initial dispatch envelope",
      );
    }

    if (
      !input.initialContext ||
      typeof input.initialContext !== "object" ||
      typeof input.initialContext.requestId !== "string" ||
      !input.initialContext.requestId.trim() ||
      typeof input.initialContext.correlationId !== "string" ||
      !input.initialContext.correlationId.trim() ||
      typeof input.initialContext.executionId !== "string" ||
      !input.initialContext.executionId.trim()
    ) {
      throw new Error(
        "AI tool orchestration loop requires an initial execution context",
      );
    }

    if (
      !input.initialExecution ||
      typeof input.initialExecution !== "object" ||
      !input.initialExecution.response ||
      typeof input.initialExecution.response !== "object"
    ) {
      throw new Error(
        "AI tool orchestration loop requires an initial execution result",
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
        "AI tool orchestration loop requires a tool execution context",
      );
    }

    if (
      !Number.isInteger(input.maximumRounds) ||
      input.maximumRounds < 1 ||
      input.maximumRounds > HARD_MAXIMUM_ORCHESTRATION_ROUNDS
    ) {
      throw new Error(
        `maximumRounds must be an integer between 1 and ${HARD_MAXIMUM_ORCHESTRATION_ROUNDS}`,
      );
    }
  }

  private assertInitialIdentity(input: AiToolOrchestrationLoopInput): void {
    if (
      input.initialEnvelope.requestId !== input.initialEnvelope.request.requestId
    ) {
      throw new Error("Initial dispatch request identity is inconsistent");
    }

    if (
      input.initialEnvelope.requestId !== input.initialContext.requestId ||
      input.initialEnvelope.requestId !== input.initialExecution.requestId
    ) {
      throw new Error(
        "Initial dispatch, context, and execution request identities do not match",
      );
    }

    if (
      input.initialEnvelope.dispatchId !== input.initialExecution.dispatchId
    ) {
      throw new Error(
        "Initial dispatch and execution dispatch identities do not match",
      );
    }

    if (
      input.initialContext.executionId !== input.initialExecution.executionId
    ) {
      throw new Error(
        "Initial context and execution identities do not match",
      );
    }
  }

  private assertCurrentIdentity(
    envelope: AiPreparedRequestDispatchEnvelope,
    context: AiExecutionContext,
    execution: AiDispatchExecutionResult,
  ): void {
    if (
      envelope.requestId !== context.requestId ||
      envelope.requestId !== execution.requestId
    ) {
      throw new Error(
        "Orchestration loop request identity changed between rounds",
      );
    }

    if (envelope.dispatchId !== execution.dispatchId) {
      throw new Error(
        "Orchestration loop dispatch identity is inconsistent",
      );
    }

    if (context.executionId !== execution.executionId) {
      throw new Error(
        "Orchestration loop execution identity is inconsistent",
      );
    }
  }
}
