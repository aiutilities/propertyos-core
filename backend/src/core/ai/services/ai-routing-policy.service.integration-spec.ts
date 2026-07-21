import { beforeEach, describe, expect, it } from '@jest/globals';
import { MockAiProvider } from '../providers/mock-ai.provider';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import { AiOrchestrationRequest } from '../types/ai-orchestration.types';
import { AiRoutingPolicyService } from './ai-routing-policy.service';

describe('AiRoutingPolicyService', () => {
  let registry: AiProviderRegistry;
  let policy: AiRoutingPolicyService;

  const baseRequest: AiOrchestrationRequest = {
    tenantId: 'tenant-phase-16a',
    capability: 'CHAT',
    executionMode: 'SIMULATED',
    dataClassification: 'INTERNAL',
    messages: [
      {
        role: 'user',
        content: 'Create a local simulated response.',
      },
    ],
    tokenBudget: {
      maxTotalTokens: 1000,
    },
  };

  beforeEach(() => {
    registry = new AiProviderRegistry();
    registry.register(new MockAiProvider());
    policy = new AiRoutingPolicyService(registry);
  });

  it('selects a deterministic active provider supporting the capability', () => {
    expect(policy.decide(baseRequest)).toEqual({
      providerName: 'mock',
      model: 'mock-model',
      capability: 'CHAT',
      executionMode: 'SIMULATED',
      tenantId: 'tenant-phase-16a',
      fallbackProviderNames: [],
      liveExecutionAuthorized: false,
    });
  });

  it('honours an explicitly requested eligible provider', () => {
    expect(
      policy.decide({
        ...baseRequest,
        providerName: 'mock',
        model: 'mock-model-explicit',
      }),
    ).toMatchObject({
      providerName: 'mock',
      model: 'mock-model-explicit',
    });
  });

  it('fails closed for live provider execution', () => {
    expect(() =>
      policy.decide({
        ...baseRequest,
        executionMode: 'LIVE',
      }),
    ).toThrow(
      'Live AI provider execution is blocked pending explicit Phase 16 authorization',
    );
  });

  it('fails closed when tenant isolation context is absent', () => {
    expect(() =>
      policy.decide({
        ...baseRequest,
        tenantId: '',
      }),
    ).toThrow('AI orchestration requires a tenantId');
  });

  it('fails closed for restricted data outside simulation', () => {
    expect(() =>
      policy.decide({
        ...baseRequest,
        executionMode: 'ISOLATED',
        dataClassification: 'RESTRICTED',
      }),
    ).toThrow(
      'Restricted data is limited to simulated AI execution during Phase 16A',
    );
  });

  it('rejects a provider lacking the required capability', () => {
    expect(() =>
      policy.decide({
        ...baseRequest,
        providerName: 'mock',
        capability: 'VISION',
      }),
    ).toThrow('AI provider mock does not support capability VISION');
  });

  it('rejects invalid token budgets', () => {
    expect(() =>
      policy.decide({
        ...baseRequest,
        tokenBudget: {
          maxTotalTokens: 0,
        },
      }),
    ).toThrow('AI total-token budget must be greater than zero');
  });
});
