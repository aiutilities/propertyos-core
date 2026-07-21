import { describe, expect, it, jest } from '@jest/globals';
import {
  AiDispatchExecutionCoordinatorService,
} from '../dispatch/ai-dispatch-execution-coordinator.service';
import {
  AiPreparedRequestDispatchBoundaryService,
} from '../dispatch/ai-prepared-request-dispatch-boundary.service';
import {
  AiRequestPreparationService,
} from '../request/ai-request-preparation.service';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { AiProviderPort } from '../contracts/ai-provider.contract';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
} from '../manifest/ai-provider-manifest';
import { AiOrchestrationError } from '../errors/ai-orchestration.error';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import { AiOrchestrationRequest } from '../types/ai-orchestration.types';
import {
  AiCapability,
  AiProvider,
  AiRequest,
  AiResponse,
} from '../types/ai.types';
import { AiOrchestrationEvidenceService } from './ai-orchestration-evidence.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import {
  AiProviderFailoverService,
} from '../resilience/ai-provider-failover.service';
import { AiRoutingPolicyService } from './ai-routing-policy.service';

class FakeAiProvider implements AiProviderPort {
  get manifest(): AiProviderManifest {
    const descriptor =
      this.getProvider();

    const defaultModel =
      descriptor.defaultModel ??
      'fake-model';

    return {
      manifestVersion:
        AI_PROVIDER_MANIFEST_VERSION,
      provider: {
        id:
          `test.${this.name}`,
        name:
          this.name,
        displayName:
          this.displayName,
        version:
          '1.0.0',
        vendor:
          'PropertyOS Test Suite',
        description:
          'Deterministic provider fixture for AI orchestration tests',
      },
      compatibility: {
        propertyOsVersion:
          '^0.1.0',
        aiContractVersion:
          `^${AI_PROVIDER_CONTRACT_VERSION}`,
      },
      execution: {
        supportedModes: [
          'SIMULATED',
          'ISOLATED',
        ],
      },
      capabilities: [
        ...this.capabilities,
      ],
      models: [
        {
          id:
            defaultModel,
          displayName:
            `${this.displayName} Model`,
          contextWindow:
            8_192,
          maxInputTokens:
            6_144,
          maxOutputTokens:
            2_048,
          supportsStreaming:
            false,
          supportsVision:
            this.capabilities.includes(
              'VISION',
            ),
          supportsToolCalling:
            this.capabilities.includes(
              'TOOL_CALLING',
            ),
        },
      ],
      limits: {
        maxInputTokens:
          6_144,
        maxOutputTokens:
          2_048,
        maxTotalTokens:
          8_192,
      },
      metadata: {
        runtime:
          'test',
        liveExecution:
          false,
      },
    };
  }

  readonly displayName: string;
  readonly capabilities: AiCapability[] = ['CHAT'];

  constructor(
    readonly name: string,
    private readonly handler: (request: AiRequest) => Promise<AiResponse>,
  ) {
    this.displayName = `Fake ${name}`;
  }

  getProvider(): AiProvider {
    return {
      id: this.name,
      name: this.name,
      displayName: this.displayName,
      status: 'ACTIVE',
      capabilities: this.capabilities,
      defaultModel: `${this.name}-model`,
    };
  }

  generate(request: AiRequest): Promise<AiResponse> {
    return this.handler(request);
  }
}

describe('AiOrchestratorService', () => {
  const request: AiOrchestrationRequest = {
    tenantId: 'tenant-phase-16a2',
    capability: 'CHAT',
    executionMode: 'SIMULATED',
    dataClassification: 'INTERNAL',
    providerName: 'primary',
    fallbackProviderNames: ['fallback'],
    messages: [
      {
        role: 'user',
        content: 'Execute a simulated orchestration request.',
      },
    ],
    timeoutMs: 100,
    tokenBudget: {
      maxTotalTokens: 100,
    },
  };

  function createService(...providers: AiProviderPort[]) {
    const registry = new AiProviderRegistry();

    for (const provider of providers) {
      registry.register(provider);
    }

    const eventBus = {
      publish: jest.fn<EventBusService['publish']>(
        async () => undefined,
      ),
    } as unknown as EventBusService;

    return new AiOrchestratorService(
      new AiRoutingPolicyService(
        registry,
      ),
      registry,
      new AiOrchestrationEvidenceService(
        eventBus,
      ),
      new AiRequestPreparationService(),
      new AiPreparedRequestDispatchBoundaryService(),
      new AiDispatchExecutionCoordinatorService(
        registry,
      ),
      undefined,
      new AiProviderFailoverService(),
    );
  }

  it('delegates provider fallback execution to the canonical failover service', async () => {
    const primary =
      new FakeAiProvider(
        'primary',
        async () => ({
          providerName:
            'primary',
          model:
            'primary-model',
          content:
            'canonical response',
        }),
      );

    const service =
      createService(
        primary,
      );

    const failover =
      (
        service as unknown as {
          failover:
            AiProviderFailoverService;
        }
      ).failover;

    const execute =
      jest.spyOn(
        failover,
        'execute',
      );

    await service.execute({
      ...request,
      fallbackProviderNames: [],
    });

    expect(execute)
      .toHaveBeenCalledTimes(
        1,
      );

    expect(execute)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          maximumAttemptsPerProvider:
            1,
          retryDelayMs:
            0,
          candidates: [
            {
              providerName:
                'primary',
              model:
                'primary-model',
            },
          ],
          execute:
            expect.any(Function),
        }),
      );
  });

  it('executes the selected provider and returns normalized evidence', async () => {
    const primary = new FakeAiProvider('primary', async () => ({
      providerName: 'primary',
      model: 'primary-model',
      content: 'primary response',
      usage: {
        totalTokens: 20,
      },
    }));

    const service = createService(primary);

    await expect(
      service.execute({
        ...request,
        fallbackProviderNames: [],
      }),
    ).resolves.toEqual({
      correlationId: expect.any(String),
      response: {
        providerName: 'primary',
        model: 'primary-model',
        content: 'primary response',
        usage: {
          totalTokens: 20,
        },
      },
      decision: {
        providerName: 'primary',
        model: 'primary-model',
        capability: 'CHAT',
        executionMode: 'SIMULATED',
        tenantId: 'tenant-phase-16a2',
        fallbackProviderNames: [],
        liveExecutionAuthorized: false,
      },
      attempts: [
        {
          providerName: 'primary',
          attempt: 1,
          status: 'SUCCEEDED',
          startedAt: expect.any(String),
          completedAt: expect.any(String),
          durationMs: expect.any(Number),
        },
      ],
    });
  });

  it('uses an eligible fallback after a provider failure', async () => {
    const primary = new FakeAiProvider('primary', async () => {
      throw new Error('simulated primary failure');
    });

    const fallback = new FakeAiProvider('fallback', async () => ({
      providerName: 'fallback',
      model: 'fallback-model',
      content: 'fallback response',
      usage: {
        totalTokens: 25,
      },
    }));

    const service = createService(primary, fallback);
    const result = await service.execute(request);

    expect(result.response.providerName).toBe('fallback');
    expect(result.decision.providerName).toBe('fallback');
    expect(result.attempts).toEqual([
      {
        providerName: 'primary',
        attempt: 1,
        status: 'FAILED',
        failureCode: 'PROVIDER_EXECUTION_FAILED',
        startedAt: expect.any(String),
        completedAt: expect.any(String),
        durationMs: expect.any(Number),
      },
      {
        providerName: 'fallback',
        attempt: 2,
        status: 'SUCCEEDED',
        startedAt: expect.any(String),
        completedAt: expect.any(String),
        durationMs: expect.any(Number),
      },
    ]);
  });

  it('uses a fallback after the selected provider times out', async () => {
    jest.useFakeTimers();

    try {
      const primary = new FakeAiProvider(
        'primary',
        () => new Promise<AiResponse>(() => undefined),
      );

      const fallback = new FakeAiProvider('fallback', async () => ({
        providerName: 'fallback',
        content: 'fallback after timeout',
        usage: {
          totalTokens: 10,
        },
      }));

      const service = createService(primary, fallback);
      const execution = service.execute({
        ...request,
        timeoutMs: 50,
      });

      await jest.advanceTimersByTimeAsync(50);

      await expect(execution).resolves.toMatchObject({
        response: {
          providerName: 'fallback',
        },
        attempts: [
          {
            providerName: 'primary',
            status: 'FAILED',
          startedAt: expect.any(String),
          completedAt: expect.any(String),
          durationMs: expect.any(Number),
            failureCode: 'PROVIDER_TIMEOUT',
          },
          {
            providerName: 'fallback',
            status: 'SUCCEEDED',
          startedAt: expect.any(String),
          completedAt: expect.any(String),
          durationMs: expect.any(Number),
          },
        ],
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('fails closed when every eligible provider fails', async () => {
    const primary = new FakeAiProvider('primary', async () => {
      throw new Error('primary failed');
    });

    const fallback = new FakeAiProvider('fallback', async () => {
      throw new Error('fallback failed');
    });

    const service = createService(primary, fallback);

    await expect(service.execute(request)).rejects.toMatchObject({
      name: 'AiOrchestrationError',
      code: 'ALL_PROVIDERS_FAILED',
      retriable: false,
      details: {
        failures: [
          {
            providerName: 'primary',
            code: 'PROVIDER_EXECUTION_FAILED',
          },
          {
            providerName: 'fallback',
            code: 'PROVIDER_EXECUTION_FAILED',
          },
        ],
      },
    });
  });

  it('fails closed when the observed token usage exceeds budget', async () => {
    const primary = new FakeAiProvider('primary', async () => ({
      providerName: 'primary',
      content: 'over-budget response',
      usage: {
        totalTokens: 101,
      },
    }));

    const fallback = new FakeAiProvider('fallback', async () => ({
      providerName: 'fallback',
      content: 'must not execute',
      usage: {
        totalTokens: 1,
      },
    }));

    const fallbackGenerate = jest.spyOn(fallback, 'generate');
    const service = createService(primary, fallback);

    await expect(service.execute(request)).rejects.toMatchObject({
      name: 'AiOrchestrationError',
      code: 'TOKEN_BUDGET_EXCEEDED',
      retriable: false,
      details: {
        providerName: 'primary',
        observedTotalTokens: 101,
        allowedTotalTokens: 100,
      },
    });

    expect(fallbackGenerate).not.toHaveBeenCalled();
  });

  it('rejects invalid timeout configuration before provider execution', async () => {
    const primary = new FakeAiProvider('primary', async () => ({
      providerName: 'primary',
      content: 'must not be accepted',
    }));

    const generate = jest.spyOn(primary, 'generate');
    const service = createService(primary);

    await expect(
      service.execute({
        ...request,
        fallbackProviderNames: [],
        timeoutMs: 0,
      }),
    ).rejects.toMatchObject({
      name: 'AiOrchestrationError',
      code: 'PROVIDER_EXECUTION_FAILED',
      retriable: false,
    });

    expect(generate).not.toHaveBeenCalled();
  });

  it('preserves the live-execution fail-closed routing boundary', async () => {
    const primary = new FakeAiProvider('primary', async () => ({
      providerName: 'primary',
      content: 'must never execute',
    }));

    const generate = jest.spyOn(primary, 'generate');
    const service = createService(primary);

    await expect(
      service.execute({
        ...request,
        executionMode: 'LIVE',
        fallbackProviderNames: [],
      }),
    ).rejects.toThrow(
      'Live AI provider execution is blocked pending explicit Phase 16 authorization',
    );

    expect(generate).not.toHaveBeenCalled();
  });
});
