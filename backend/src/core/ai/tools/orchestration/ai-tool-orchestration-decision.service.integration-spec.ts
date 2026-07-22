import { describe, expect, it } from "@jest/globals";

import { AiToolCall } from "./ai-tool-call-orchestration.types";
import { AiToolOrchestrationDecisionService } from "./ai-tool-orchestration-decision.service";

describe("AiToolOrchestrationDecisionService", () => {
  const service = new AiToolOrchestrationDecisionService();

  const calls = (): readonly AiToolCall[] =>
    Object.freeze([
      Object.freeze({
        callId: "call-property",
        toolId: "property.lookup",
        input: Object.freeze({
          propertyId: "property-1",
        }),
      }),
    ]) as readonly AiToolCall[];

  it("returns a terminal decision when no tool calls remain", () => {
    const result = service.decide({
      currentRound: 0,
      maximumRounds: 3,
      calls: Object.freeze([]),
    });

    expect(result.outcome).toBe("TERMINAL");
    expect(result.terminal).toBe(true);
    expect(result.shouldContinue).toBe(false);
    expect(result.exhausted).toBe(false);
    expect(result.evidence.remainingRounds).toBe(3);
  });

  it("continues when tool calls exist below the round limit", () => {
    const result = service.decide({
      currentRound: 1,
      maximumRounds: 3,
      calls: calls(),
    });

    expect(result.outcome).toBe("CONTINUE");
    expect(result.shouldContinue).toBe(true);
    expect(result.terminal).toBe(false);
    expect(result.exhausted).toBe(false);
    expect(result.evidence.remainingRounds).toBe(2);
  });

  it("returns exhaustion when calls remain at the round limit", () => {
    const result = service.decide({
      currentRound: 3,
      maximumRounds: 3,
      calls: calls(),
    });

    expect(result.outcome).toBe("EXHAUSTED");
    expect(result.exhausted).toBe(true);
    expect(result.shouldContinue).toBe(false);
    expect(result.terminal).toBe(false);
    expect(result.evidence.remainingRounds).toBe(0);
  });

  it("allows a terminal response at the round limit", () => {
    const result = service.decide({
      currentRound: 3,
      maximumRounds: 3,
      calls: Object.freeze([]),
    });

    expect(result.outcome).toBe("TERMINAL");
    expect(result.terminal).toBe(true);
    expect(result.exhausted).toBe(false);
  });

  it("creates immutable decision evidence", () => {
    const result = service.decide({
      currentRound: 1,
      maximumRounds: 4,
      calls: calls(),
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);

    expect(result.evidence).toEqual({
      currentRound: 1,
      maximumRounds: 4,
      requestedCallCount: 1,
      remainingRounds: 3,
      outcome: "CONTINUE",
    });
  });

  it("does not mutate the supplied call collection", () => {
    const suppliedCalls = calls();

    service.decide({
      currentRound: 0,
      maximumRounds: 2,
      calls: suppliedCalls,
    });

    expect(suppliedCalls).toHaveLength(1);
    expect(suppliedCalls[0].callId).toBe("call-property");
  });

  it("rejects a missing decision input", () => {
    expect(() =>
      service.decide(
        undefined as unknown as Parameters<
          AiToolOrchestrationDecisionService["decide"]
        >[0],
      ),
    ).toThrow("AI tool orchestration decision input is required");
  });

  it("rejects a negative current round", () => {
    expect(() =>
      service.decide({
        currentRound: -1,
        maximumRounds: 3,
        calls: Object.freeze([]),
      }),
    ).toThrow(
      "AI tool orchestration currentRound must be a non-negative integer",
    );
  });

  it("rejects a non-integer current round", () => {
    expect(() =>
      service.decide({
        currentRound: 0.5,
        maximumRounds: 3,
        calls: Object.freeze([]),
      }),
    ).toThrow(
      "AI tool orchestration currentRound must be a non-negative integer",
    );
  });

  it("rejects a zero maximum round limit", () => {
    expect(() =>
      service.decide({
        currentRound: 0,
        maximumRounds: 0,
        calls: Object.freeze([]),
      }),
    ).toThrow("AI tool orchestration maximumRounds must be a positive integer");
  });

  it("rejects a current round greater than the limit", () => {
    expect(() =>
      service.decide({
        currentRound: 4,
        maximumRounds: 3,
        calls: calls(),
      }),
    ).toThrow("AI tool orchestration currentRound cannot exceed maximumRounds");
  });

  it("rejects an invalid tool-call collection", () => {
    expect(() =>
      service.decide({
        currentRound: 0,
        maximumRounds: 3,
        calls: undefined as unknown as readonly AiToolCall[],
      }),
    ).toThrow("AI tool orchestration decision requires a tool-call collection");
  });

  it("rejects malformed tool calls", () => {
    expect(() =>
      service.decide({
        currentRound: 0,
        maximumRounds: 3,
        calls: Object.freeze([
          Object.freeze({
            callId: "",
            toolId: "property.lookup",
            input: Object.freeze({}),
          }),
        ]) as readonly AiToolCall[],
      }),
    ).toThrow("AI tool orchestration call 0 requires a callId");
  });
});
