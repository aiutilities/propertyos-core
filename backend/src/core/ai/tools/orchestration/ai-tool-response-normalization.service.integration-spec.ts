import { describe, expect, it } from "@jest/globals";

import { AiResponse } from "../../types/ai.types";
import { AiToolResponseNormalizationService } from "./ai-tool-response-normalization.service";

describe("AiToolResponseNormalizationService", () => {
  const service = new AiToolResponseNormalizationService();

  const response = (raw?: unknown): AiResponse => ({
    providerName: "openai",
    model: "gpt-test",
    content: "Provider response",
    raw,
  });

  it("normalizes OpenAI-compatible function tool calls", () => {
    const result = service.normalize({
      response: response({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call-property",
                  type: "function",
                  function: {
                    name: "property.lookup",
                    arguments: JSON.stringify({
                      propertyId: "property-1",
                      includeUnits: true,
                    }),
                  },
                },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
      }),
    });

    expect(result.calls).toEqual([
      {
        callId: "call-property",
        toolId: "property.lookup",
        input: {
          propertyId: "property-1",
          includeUnits: true,
        },
      },
    ]);

    expect(result.evidence).toEqual({
      providerName: "openai",
      protocol: "OPENAI_COMPATIBLE",
      rawResponsePresent: true,
      requestedCallCount: 1,
      normalizedCallCount: 1,
      terminal: false,
    });
  });

  it("normalizes multiple OpenAI-compatible calls in order", () => {
    const result = service.normalize({
      response: response({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call-one",
                  type: "function",
                  function: {
                    name: "property.lookup",
                    arguments: '{"propertyId":"property-1"}',
                  },
                },
                {
                  id: "call-two",
                  type: "function",
                  function: {
                    name: "lease.lookup",
                    arguments: '{"leaseId":"lease-1"}',
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    expect(result.calls.map((call) => call.callId)).toEqual([
      "call-one",
      "call-two",
    ]);
  });

  it("normalizes Anthropic tool_use blocks", () => {
    const result = service.normalize({
      response: {
        providerName: "claude",
        model: "claude-test",
        content: "Provider response",
        raw: {
          type: "message",
          content: [
            {
              type: "text",
              text: "I will check the property.",
            },
            {
              type: "tool_use",
              id: "toolu-property",
              name: "property.lookup",
              input: {
                propertyId: "property-1",
              },
            },
          ],
          stop_reason: "tool_use",
        },
      },
    });

    expect(result.calls).toEqual([
      {
        callId: "toolu-property",
        toolId: "property.lookup",
        input: {
          propertyId: "property-1",
        },
      },
    ]);

    expect(result.evidence.protocol).toBe("ANTHROPIC_MESSAGES");

    expect(result.evidence.terminal).toBe(false);
  });

  it("returns an empty terminal result for a text response", () => {
    const result = service.normalize({
      response: response({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Completed",
            },
            finish_reason: "stop",
          },
        ],
      }),
    });

    expect(result.calls).toEqual([]);
    expect(result.evidence.requestedCallCount).toBe(0);
    expect(result.evidence.normalizedCallCount).toBe(0);
    expect(result.evidence.terminal).toBe(true);
  });

  it("returns an empty result when no raw response exists", () => {
    const result = service.normalize({
      response: response(),
    });

    expect(result.calls).toEqual([]);
    expect(result.evidence.protocol).toBe("NONE");
    expect(result.evidence.rawResponsePresent).toBe(false);
    expect(result.evidence.terminal).toBe(true);
  });

  it("creates deeply immutable normalized results", () => {
    const result = service.normalize({
      response: response({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call-property",
                  function: {
                    name: "property.lookup",
                    arguments:
                      '{"filters":{"active":true},"ids":["one","two"]}',
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.calls)).toBe(true);
    expect(Object.isFrozen(result.calls[0])).toBe(true);
    expect(Object.isFrozen(result.calls[0].input)).toBe(true);

    const input = result.calls[0].input as {
      filters: {
        active: boolean;
      };
      ids: string[];
    };

    expect(Object.isFrozen(input.filters)).toBe(true);
    expect(Object.isFrozen(input.ids)).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);
  });

  it("rejects invalid OpenAI-compatible JSON arguments", () => {
    expect(() =>
      service.normalize({
        response: response({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: "call-property",
                    function: {
                      name: "property.lookup",
                      arguments: "{invalid-json",
                    },
                  },
                ],
              },
            },
          ],
        }),
      }),
    ).toThrow("OpenAI-compatible tool call 0 contains invalid JSON arguments");
  });

  it("rejects malformed Anthropic tool_use input", () => {
    expect(() =>
      service.normalize({
        response: {
          providerName: "claude",
          content: "Provider response",
          raw: {
            content: [
              {
                type: "tool_use",
                id: "toolu-property",
                name: "property.lookup",
              },
            ],
          },
        },
      }),
    ).toThrow("Anthropic tool_use block 0 requires input");
  });

  it("rejects duplicate normalized call identifiers", () => {
    expect(() =>
      service.normalize({
        response: response({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: "duplicate",
                    function: {
                      name: "property.lookup",
                      arguments: "{}",
                    },
                  },
                  {
                    id: "duplicate",
                    function: {
                      name: "lease.lookup",
                      arguments: "{}",
                    },
                  },
                ],
              },
            },
          ],
        }),
      }),
    ).toThrow("Duplicate normalized AI tool-call id: duplicate");
  });

  it("rejects a missing normalization input", () => {
    expect(() =>
      service.normalize(
        undefined as unknown as Parameters<
          AiToolResponseNormalizationService["normalize"]
        >[0],
      ),
    ).toThrow("AI tool response normalization input is required");
  });

  it("rejects a response without a provider name", () => {
    expect(() =>
      service.normalize({
        response: {
          providerName: "",
          content: "Provider response",
        },
      }),
    ).toThrow("AI tool response normalization requires a provider name");
  });

  it("rejects a malformed OpenAI tool-call collection", () => {
    expect(() =>
      service.normalize({
        response: response({
          choices: [
            {
              message: {
                tool_calls: {},
              },
            },
          ],
        }),
      }),
    ).toThrow("OpenAI-compatible tool_calls must be an array");
  });
});
