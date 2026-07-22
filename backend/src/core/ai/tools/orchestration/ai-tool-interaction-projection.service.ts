import { Injectable } from "@nestjs/common";

import { AiMessage } from "../../types/ai.types";
import { AiToolCallExecutionRecord } from "./ai-tool-call-orchestration.types";
import {
  AiToolInteractionProjectionInput,
  AiToolInteractionProjectionResult,
} from "./ai-tool-interaction-projection.types";

@Injectable()
export class AiToolInteractionProjectionService {
  project(
    input: AiToolInteractionProjectionInput,
  ): AiToolInteractionProjectionResult {
    this.assertInput(input);

    const includeSkippedCalls = input.includeSkippedCalls ?? false;

    const messages: AiMessage[] = [];
    let omittedSkippedCount = 0;

    for (const record of input.batchResult.records) {
      if (record.outcome === "SKIPPED" && includeSkippedCalls === false) {
        omittedSkippedCount += 1;
        continue;
      }

      messages.push(this.projectRecord(record));
    }

    return Object.freeze({
      messages: Object.freeze(
        messages.map((message) =>
          Object.freeze({
            ...message,
          }),
        ),
      ),
      evidence: Object.freeze({
        requestedRecordCount: input.batchResult.records.length,
        projectedMessageCount: messages.length,
        omittedSkippedCount,
        includeSkippedCalls,
      }),
    });
  }

  private projectRecord(record: AiToolCallExecutionRecord): AiMessage {
    return {
      role: "tool",
      toolCallId: record.callId,
      toolName: record.toolId,
      content: JSON.stringify(this.createPayload(record)),
    };
  }

  private createPayload(
    record: AiToolCallExecutionRecord,
  ): Record<string, unknown> {
    if (record.outcome === "SKIPPED") {
      return {
        success: false,
        outcome: "SKIPPED",
        errorCode: "AI_TOOL_CALL_SKIPPED",
        errorMessage: record.skipReason ?? "Tool call was skipped",
        retryable: false,
      };
    }

    if (!record.result) {
      throw new Error(
        `Executed tool-call record has no result: ${record.callId}`,
      );
    }

    const executionResult = record.result;

    if (!("errorCode" in executionResult)) {
      return {
        success: true,
        outcome: "SUCCEEDED",
        output: executionResult.output,
        durationMs: executionResult.durationMs,
      };
    }

    return {
      success: false,
      outcome: "FAILED",
      errorCode: executionResult.errorCode,
      errorMessage: executionResult.errorMessage,
      retryable: executionResult.retryable,
      durationMs: executionResult.durationMs,
    };
  }

  private assertInput(input: AiToolInteractionProjectionInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool interaction projection input is required");
    }

    if (
      !input.batchResult ||
      typeof input.batchResult !== "object" ||
      !Array.isArray(input.batchResult.records)
    ) {
      throw new Error("AI tool interaction projection requires a batch result");
    }
  }
}
