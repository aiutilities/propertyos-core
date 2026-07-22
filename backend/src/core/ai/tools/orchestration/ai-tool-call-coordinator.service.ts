import { Injectable } from "@nestjs/common";

import { AiToolExecutionService } from "../execution/ai-tool-execution.service";
import {
  AiToolCall,
  AiToolCallBatchInput,
  AiToolCallBatchResult,
  AiToolCallExecutionRecord,
} from "./ai-tool-call-orchestration.types";

const DEFAULT_MAXIMUM_TOOL_CALLS = 8;
const HARD_MAXIMUM_TOOL_CALLS = 32;

@Injectable()
export class AiToolCallCoordinatorService {
  constructor(private readonly executionService: AiToolExecutionService) {}

  async executeBatch(
    input: AiToolCallBatchInput,
  ): Promise<AiToolCallBatchResult> {
    const startedAt = Date.now();

    this.assertInput(input);

    const maximumCalls = this.resolveMaximumCalls(input.maximumCalls);

    const continueOnFailure = input.continueOnFailure ?? false;

    const records: AiToolCallExecutionRecord[] = [];
    const seenCallIds = new Set<string>();

    let stoppedEarly = false;

    for (let index = 0; index < input.calls.length; index += 1) {
      const call = input.calls[index];
      const sequence = index + 1;

      if (sequence > maximumCalls) {
        records.push(
          this.skippedRecord(
            call,
            sequence,
            `Maximum tool-call count exceeded: ${maximumCalls}`,
          ),
        );

        continue;
      }

      const callId = call.callId.trim();

      if (seenCallIds.has(callId)) {
        records.push(
          this.skippedRecord(
            call,
            sequence,
            `Duplicate tool-call identifier: ${callId}`,
          ),
        );

        continue;
      }

      seenCallIds.add(callId);

      if (stoppedEarly) {
        records.push(
          this.skippedRecord(
            call,
            sequence,
            "Tool-call batch stopped after a previous failure",
          ),
        );

        continue;
      }

      const result = await this.executionService.execute({
        toolId: call.toolId,
        input: call.input,
        context: input.context,
      });

      records.push({
        callId,
        toolId: call.toolId.trim(),
        sequence,
        outcome: result.success ? "SUCCEEDED" : "FAILED",
        result,
      });

      if (result.success === false && continueOnFailure === false) {
        stoppedEarly = true;
      }
    }

    const succeededCallCount = records.filter(
      (record) => record.outcome === "SUCCEEDED",
    ).length;

    const failedCallCount = records.filter(
      (record) => record.outcome === "FAILED",
    ).length;

    const skippedCallCount = records.filter(
      (record) => record.outcome === "SKIPPED",
    ).length;

    return Object.freeze({
      records: Object.freeze(
        records.map((record) =>
          Object.freeze({
            ...record,
          }),
        ),
      ),
      evidence: Object.freeze({
        requestedCallCount: input.calls.length,
        executedCallCount: succeededCallCount + failedCallCount,
        succeededCallCount,
        failedCallCount,
        skippedCallCount,
        maximumCalls,
        continueOnFailure,
        stoppedEarly,
        durationMs: Math.max(0, Date.now() - startedAt),
      }),
    });
  }

  private assertInput(input: AiToolCallBatchInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool-call batch input is required");
    }

    if (!Array.isArray(input.calls) || input.calls.length === 0) {
      throw new Error("AI tool-call batch requires at least one call");
    }

    if (!input.context || typeof input.context !== "object") {
      throw new Error("AI tool-call batch requires an execution context");
    }

    input.calls.forEach((call, index) => {
      if (!call || typeof call !== "object") {
        throw new Error(`AI tool call ${index} is invalid`);
      }

      if (typeof call.callId !== "string" || call.callId.trim().length === 0) {
        throw new Error(`AI tool call ${index} requires a callId`);
      }

      if (typeof call.toolId !== "string" || call.toolId.trim().length === 0) {
        throw new Error(`AI tool call ${index} requires a toolId`);
      }
    });
  }

  private resolveMaximumCalls(requested: number | undefined): number {
    const value = requested ?? DEFAULT_MAXIMUM_TOOL_CALLS;

    if (
      !Number.isInteger(value) ||
      value <= 0 ||
      value > HARD_MAXIMUM_TOOL_CALLS
    ) {
      throw new Error(
        `maximumCalls must be an integer between 1 and ${HARD_MAXIMUM_TOOL_CALLS}`,
      );
    }

    return value;
  }

  private skippedRecord(
    call: AiToolCall,
    sequence: number,
    skipReason: string,
  ): AiToolCallExecutionRecord {
    return {
      callId: call.callId.trim(),
      toolId: call.toolId.trim(),
      sequence,
      outcome: "SKIPPED",
      skipReason,
    };
  }
}
