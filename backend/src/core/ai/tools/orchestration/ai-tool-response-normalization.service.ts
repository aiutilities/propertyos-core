import { Injectable } from "@nestjs/common";

import { AiResponse } from "../../types/ai.types";
import { AiToolCall } from "./ai-tool-call-orchestration.types";
import {
  AiToolResponseNormalizationEvidence,
  AiToolResponseNormalizationInput,
  AiToolResponseNormalizationResult,
  AiToolResponseProtocol,
} from "./ai-tool-response-normalization.types";

type UnknownRecord = Record<string, unknown>;

@Injectable()
export class AiToolResponseNormalizationService {
  normalize(
    input: AiToolResponseNormalizationInput,
  ): AiToolResponseNormalizationResult {
    this.assertInput(input);

    const raw = input.response.raw;

    let protocol: AiToolResponseProtocol = "NONE";
    let requestedCallCount = 0;
    let calls: readonly AiToolCall[] = Object.freeze([]);

    if (this.isOpenAiCompatibleResponse(raw)) {
      protocol = "OPENAI_COMPATIBLE";

      const result = this.normalizeOpenAiCompatible(raw);

      requestedCallCount = result.requestedCallCount;
      calls = result.calls;
    } else if (this.isAnthropicMessagesResponse(raw)) {
      protocol = "ANTHROPIC_MESSAGES";

      const result = this.normalizeAnthropicMessages(raw);

      requestedCallCount = result.requestedCallCount;
      calls = result.calls;
    }

    const evidence: AiToolResponseNormalizationEvidence = Object.freeze({
      providerName: input.response.providerName.trim(),
      protocol,
      rawResponsePresent: raw !== undefined && raw !== null,
      requestedCallCount,
      normalizedCallCount: calls.length,
      terminal: calls.length === 0,
    });

    return Object.freeze({
      calls,
      evidence,
    });
  }

  private normalizeOpenAiCompatible(raw: UnknownRecord): {
    readonly requestedCallCount: number;
    readonly calls: readonly AiToolCall[];
  } {
    const choices = raw.choices;

    if (!Array.isArray(choices) || choices.length === 0) {
      return Object.freeze({
        requestedCallCount: 0,
        calls: Object.freeze([]),
      });
    }

    const firstChoice = choices[0];

    if (!this.isRecord(firstChoice)) {
      throw new Error(
        "OpenAI-compatible tool response contains an invalid first choice",
      );
    }

    const message = firstChoice.message;

    if (!this.isRecord(message)) {
      return Object.freeze({
        requestedCallCount: 0,
        calls: Object.freeze([]),
      });
    }

    const toolCalls = message.tool_calls;

    if (toolCalls === undefined || toolCalls === null) {
      return Object.freeze({
        requestedCallCount: 0,
        calls: Object.freeze([]),
      });
    }

    if (!Array.isArray(toolCalls)) {
      throw new Error("OpenAI-compatible tool_calls must be an array");
    }

    const calls = toolCalls.map((toolCall, index) =>
      this.normalizeOpenAiToolCall(toolCall, index),
    );

    this.assertUniqueCallIds(calls);

    return Object.freeze({
      requestedCallCount: toolCalls.length,
      calls: Object.freeze(calls),
    });
  }

  private normalizeOpenAiToolCall(value: unknown, index: number): AiToolCall {
    if (!this.isRecord(value)) {
      throw new Error(`OpenAI-compatible tool call ${index} is invalid`);
    }

    const callId = this.requiredString(
      value.id,
      `OpenAI-compatible tool call ${index} requires an id`,
    );

    if (value.type !== undefined && value.type !== "function") {
      throw new Error(
        `OpenAI-compatible tool call ${index} has an unsupported type`,
      );
    }

    if (!this.isRecord(value.function)) {
      throw new Error(
        `OpenAI-compatible tool call ${index} requires a function`,
      );
    }

    const toolId = this.requiredString(
      value.function.name,
      `OpenAI-compatible tool call ${index} requires a function name`,
    );

    const rawArguments = value.function.arguments;

    if (typeof rawArguments !== "string") {
      throw new Error(
        `OpenAI-compatible tool call ${index} requires JSON arguments`,
      );
    }

    let parsedArguments: unknown;

    try {
      parsedArguments = JSON.parse(rawArguments);
    } catch {
      throw new Error(
        `OpenAI-compatible tool call ${index} contains invalid JSON arguments`,
      );
    }

    this.assertJsonValue(
      parsedArguments,
      `OpenAI-compatible tool call ${index} arguments`,
    );

    return Object.freeze({
      callId,
      toolId,
      input: this.deepFreezeJson(parsedArguments) as AiToolCall["input"],
    });
  }

  private normalizeAnthropicMessages(raw: UnknownRecord): {
    readonly requestedCallCount: number;
    readonly calls: readonly AiToolCall[];
  } {
    const content = raw.content;

    if (!Array.isArray(content)) {
      return Object.freeze({
        requestedCallCount: 0,
        calls: Object.freeze([]),
      });
    }

    const toolUseBlocks = content.filter(
      (block) => this.isRecord(block) && block.type === "tool_use",
    );

    const calls = toolUseBlocks.map((block, index) =>
      this.normalizeAnthropicToolUse(block, index),
    );

    this.assertUniqueCallIds(calls);

    return Object.freeze({
      requestedCallCount: toolUseBlocks.length,
      calls: Object.freeze(calls),
    });
  }

  private normalizeAnthropicToolUse(
    value: UnknownRecord,
    index: number,
  ): AiToolCall {
    const callId = this.requiredString(
      value.id,
      `Anthropic tool_use block ${index} requires an id`,
    );

    const toolId = this.requiredString(
      value.name,
      `Anthropic tool_use block ${index} requires a name`,
    );

    if (value.input === undefined) {
      throw new Error(`Anthropic tool_use block ${index} requires input`);
    }

    this.assertJsonValue(
      value.input,
      `Anthropic tool_use block ${index} input`,
    );

    return Object.freeze({
      callId,
      toolId,
      input: this.deepFreezeJson(value.input) as AiToolCall["input"],
    });
  }

  private assertUniqueCallIds(calls: readonly AiToolCall[]): void {
    const seen = new Set<string>();

    calls.forEach((call) => {
      if (seen.has(call.callId)) {
        throw new Error(`Duplicate normalized AI tool-call id: ${call.callId}`);
      }

      seen.add(call.callId);
    });
  }

  private assertInput(input: AiToolResponseNormalizationInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool response normalization input is required");
    }

    const response = input.response;

    if (!response || typeof response !== "object") {
      throw new Error("AI tool response normalization requires a response");
    }

    if (
      typeof response.providerName !== "string" ||
      !response.providerName.trim()
    ) {
      throw new Error(
        "AI tool response normalization requires a provider name",
      );
    }

    if (typeof response.content !== "string") {
      throw new Error(
        "AI tool response normalization requires response content",
      );
    }
  }

  private isOpenAiCompatibleResponse(value: unknown): value is UnknownRecord {
    return this.isRecord(value) && Array.isArray(value.choices);
  }

  private isAnthropicMessagesResponse(value: unknown): value is UnknownRecord {
    return this.isRecord(value) && Array.isArray(value.content);
  }

  private requiredString(value: unknown, message: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(message);
    }

    return value.trim();
  }

  private assertJsonValue(value: unknown, path: string): void {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      return;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) =>
        this.assertJsonValue(entry, `${path}[${index}]`),
      );

      return;
    }

    if (this.isRecord(value)) {
      Object.entries(value).forEach(([key, entry]) =>
        this.assertJsonValue(entry, `${path}.${key}`),
      );

      return;
    }

    throw new Error(`${path} must contain valid JSON values`);
  }

  private deepFreezeJson(value: unknown): unknown {
    if (Array.isArray(value)) {
      value.forEach((entry) => this.deepFreezeJson(entry));

      return Object.freeze(value);
    }

    if (this.isRecord(value)) {
      Object.values(value).forEach((entry) => this.deepFreezeJson(entry));

      return Object.freeze(value);
    }

    return value;
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
