import { Injectable } from "@nestjs/common";

import {
  AiPreparedMessage,
  AiPreparedProviderRequest,
} from "../../types/ai-request-preparation.types";
import { AiMessage } from "../../types/ai.types";
import {
  AiToolContinuationBoundaryEvidence,
  AiToolContinuationBoundaryInput,
  AiToolContinuationBoundaryResult,
} from "./ai-tool-continuation-boundary.types";

@Injectable()
export class AiToolContinuationBoundaryService {
  create(
    input: AiToolContinuationBoundaryInput,
  ): AiToolContinuationBoundaryResult {
    this.assertInput(input);

    const request = input.request;
    const projectedMessages = input.projection.messages;

    const preparedToolMessages: AiPreparedMessage[] = [];
    const toolCallIds: string[] = [];
    const observedCallIds = new Set<string>();

    projectedMessages.forEach((message, index) => {
      const preparedMessage = this.prepareToolMessage(message, index);

      const toolCallId = String(preparedMessage.metadata?.toolCallId);

      if (observedCallIds.has(toolCallId)) {
        throw new Error(`Duplicate projected tool-call id: ${toolCallId}`);
      }

      observedCallIds.add(toolCallId);
      toolCallIds.push(toolCallId);
      preparedToolMessages.push(preparedMessage);
    });

    const messages = Object.freeze([
      ...request.messages,
      ...preparedToolMessages,
    ]);

    const normalizations = Object.freeze([
      ...request.evidence.normalizations,
      "continuation:tool-messages-appended",
    ]);

    const preparedRequest: AiPreparedProviderRequest = Object.freeze({
      ...request,
      messages,
      evidence: Object.freeze({
        ...request.evidence,
        messageCount: messages.length,
        normalizations,
      }),
    });

    const evidence: AiToolContinuationBoundaryEvidence = Object.freeze({
      requestId: request.requestId,
      originalMessageCount: request.messages.length,
      projectedMessageCount: projectedMessages.length,
      continuationMessageCount: messages.length,
      toolCallIds: Object.freeze([...toolCallIds]),
    });

    return Object.freeze({
      request: preparedRequest,
      evidence,
    });
  }

  private prepareToolMessage(
    message: AiMessage,
    index: number,
  ): AiPreparedMessage {
    if (!message || typeof message !== "object") {
      throw new Error(`Projected tool message ${index} is invalid`);
    }

    if (message.role !== "tool") {
      throw new Error(`Projected message ${index} must use the tool role`);
    }

    if (
      typeof message.content !== "string" ||
      message.content.trim().length === 0
    ) {
      throw new Error(`Projected tool message ${index} has empty content`);
    }

    const toolCallId =
      typeof message.toolCallId === "string" ? message.toolCallId.trim() : "";

    if (!toolCallId) {
      throw new Error(`Projected tool message ${index} has no tool-call id`);
    }

    const toolName =
      typeof message.toolName === "string" ? message.toolName.trim() : "";

    if (!toolName) {
      throw new Error(`Projected tool message ${index} has no tool name`);
    }

    return Object.freeze({
      role: "TOOL",
      content: message.content,
      metadata: Object.freeze({
        toolCallId,
        toolName,
        source: "AI_TOOL_INTERACTION_PROJECTION",
      }),
    });
  }

  private assertInput(input: AiToolContinuationBoundaryInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool continuation boundary input is required");
    }

    if (
      !input.request ||
      typeof input.request !== "object" ||
      typeof input.request.requestId !== "string" ||
      !input.request.requestId.trim() ||
      !Array.isArray(input.request.messages) ||
      input.request.messages.length === 0 ||
      !input.request.evidence ||
      typeof input.request.evidence !== "object" ||
      !Array.isArray(input.request.evidence.normalizations)
    ) {
      throw new Error(
        "AI tool continuation boundary requires a prepared request",
      );
    }

    if (
      !input.projection ||
      typeof input.projection !== "object" ||
      !Array.isArray(input.projection.messages)
    ) {
      throw new Error(
        "AI tool continuation boundary requires a projection result",
      );
    }

    if (input.projection.messages.length === 0) {
      throw new Error(
        "AI tool continuation boundary requires at least one projected message",
      );
    }
  }
}
