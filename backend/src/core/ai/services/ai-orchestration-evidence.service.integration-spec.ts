import { describe, expect, it, jest } from '@jest/globals';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { AiOrchestrationError } from '../errors/ai-orchestration.error';
import { AiOrchestrationEvidenceService } from './ai-orchestration-evidence.service';
import { AiFailurePolicyService } from '../resilience/ai-failure-policy.service';
import { AiRecoveryDecisionService } from '../resilience/ai-recovery-decision.service';

describe('AiOrchestrationEvidenceService', () => {
  function createService() {
    const publish = jest.fn<EventBusService['publish']>(
      async () => undefined,
    );

    const eventBus = {
      publish,
    } as unknown as EventBusService;

    return {
      service: new AiOrchestrationEvidenceService(
        eventBus,
        new AiFailurePolicyService(),
        new AiRecoveryDecisionService(),
      ),
      publish,
    };
  }

  const request = {
    tenantId: 'tenant-evidence',
    capability: 'CHAT' as const,
    executionMode: 'SIMULATED' as const,
    dataClassification: 'INTERNAL' as const,
    messages: [
      {
        role: 'user' as const,
        content: 'Create evidence without exposing secrets.',
      },
    ],
    metadata: {
      operation: 'maintenance-summary',
      apiKey: 'must-not-leak',
      nested: {
        accessToken: 'must-not-leak',
        safeValue: 'visible',
      },
    },
  };

  const decision = {
    providerName: 'mock',
    model: 'mock-model',
    capability: 'CHAT' as const,
    executionMode: 'SIMULATED' as const,
    tenantId: 'tenant-evidence',
    fallbackProviderNames: [],
    liveExecutionAuthorized: false,
  };

  it('publishes requested evidence with secret-safe metadata', async () => {
    const { service, publish } = createService();

    await service.recordRequested({
      correlationId: 'correlation-requested',
      request,
      decision,
    });

    expect(publish).toHaveBeenCalledWith(
      'ai.orchestration.requested',
      'core.ai.orchestration',
      expect.objectContaining({
        correlationId: 'correlation-requested',
        status: 'REQUESTED',
        selectedProviderName: 'mock',
        metadata: {
          operation: 'maintenance-summary',
          apiKey: '[REDACTED]',
          nested: {
            accessToken: '[REDACTED]',
            safeValue: 'visible',
          },
        },
      }),
    );
  });

  it('publishes succeeded evidence with usage and attempt history', async () => {
    const { service, publish } = createService();
    const attempts = [
      {
        providerName: 'mock',
        attempt: 1,
        status: 'SUCCEEDED' as const,
        startedAt: '2026-07-21T00:00:00.000Z',
        completedAt: '2026-07-21T00:00:00.010Z',
        durationMs: 10,
      },
    ];

    const loop = {
      outcome:
        'TERMINAL' as const,
      maximumRounds:
        3,
      completedContinuationRounds:
        1,
      observedResponseCount:
        2,
      normalizedToolCallCount:
        1,
      executedToolCallCount:
        1,
      succeededToolCallCount:
        1,
      failedToolCallCount:
        0,
      skippedToolCallCount:
        0,
      initialDispatchId:
        'dispatch-initial',
      initialExecutionId:
        'execution-initial',
      finalDispatchId:
        'dispatch-final',
      finalExecutionId:
        'execution-final',
    };

    await service.recordSucceeded({
      correlationId: 'correlation-succeeded',
      request,
      decision,
      response: {
        providerName: 'mock',
        model: 'mock-model',
        content: 'safe response',
        usage: {
          totalTokens: 12,
        },
      },
      attempts,
      loop,
    });

    expect(publish).toHaveBeenCalledWith(
      'ai.orchestration.succeeded',
      'core.ai.orchestration',
      expect.objectContaining({
        status: 'SUCCEEDED',
        attempts,
        loop,
        usage: {
          totalTokens: 12,
        },
      }),
    );

    const publishedEvidence =
      publish.mock.calls[0]?.[2];

    expect(publishedEvidence)
      .not.toHaveProperty(
        'requestId',
      );

    expect(publishedEvidence)
      .not.toHaveProperty(
        'rounds',
      );

    expect(publishedEvidence)
      .not.toHaveProperty(
        'toolContext',
      );

    expect(
      JSON.stringify(
        publishedEvidence,
      ),
    ).not.toContain(
      'must-not-leak',
    );
  });

  it('publishes normalized failure evidence without error messages', async () => {
    const { service, publish } = createService();

    await service.recordFailed({
      correlationId: 'correlation-failed',
      request,
      decision,
      error: new AiOrchestrationError({
        code: 'PROVIDER_EXECUTION_FAILED',
        message: 'sensitive provider response must not enter evidence',
        retriable: true,
      }),
      attempts: [],
    });

    expect(publish).toHaveBeenCalledWith(
      'ai.orchestration.failed',
      'core.ai.orchestration',
      expect.objectContaining({
        status: 'FAILED',
        failure: expect.objectContaining({
          code: 'PROVIDER_EXECUTION_FAILED',
          retriable: true,
          classification: expect.objectContaining({
            category: 'PROVIDER',
            severity: 'HIGH',
            recoveryAction: 'FALLBACK_PROVIDER',
          }),
        }),
      }),
    );

    expect(JSON.stringify(publish.mock.calls)).not.toContain(
      'sensitive provider response',
    );
  });

  it('recursively sanitizes arrays and nested metadata objects', () => {
    const { service } = createService();

    expect(
      service.sanitizeMetadata({
        items: [
          {
            password: 'hidden',
            label: 'visible',
          },
        ],
        authorization: 'Bearer hidden',
      }),
    ).toEqual({
      items: [
        {
          password: '[REDACTED]',
          label: 'visible',
        },
      ],
      authorization: '[REDACTED]',
    });
  });


describe(
  'AiOrchestrationEvidenceService recovery evidence',
  () => {
    it(
      'publishes recovery started evidence',
      async () => {
        const {
          service,
          publish,
        } = createService();

        await service.recordRecoveryStarted({
          correlationId:
            'correlation-recovery-start',
          tenantId:
            'tenant-recovery',
          action:
            'RETRY',
          attemptNumber:
            1,
          message:
            'retry approved',
        });

        expect(
          publish,
        ).toHaveBeenCalledWith(
          'ai.recovery.started',
          'core.ai.orchestration',
          expect.objectContaining({
            recoveryExecution: {
              status:
                'STARTED',
              action:
                'RETRY',
              attemptNumber:
                1,
              message:
                'retry approved',
            },
          }),
        );
      },
    );

    it(
      'publishes recovery completed evidence',
      async () => {
        const {
          service,
          publish,
        } = createService();

        await service.recordRecoveryCompleted({
          correlationId:
            'correlation-recovery-complete',
          tenantId:
            'tenant-recovery',
          action:
            'FALLBACK_PROVIDER',
          attemptNumber:
            2,
          message:
            'fallback succeeded',
        });

        expect(
          publish,
        ).toHaveBeenCalledWith(
          'ai.recovery.completed',
          'core.ai.orchestration',
          expect.objectContaining({
            status:
              'SUCCEEDED',
          }),
        );
      },
    );

    it(
      'publishes recovery failed evidence',
      async () => {
        const {
          service,
          publish,
        } = createService();

        await service.recordRecoveryFailed({
          correlationId:
            'correlation-recovery-failed',
          tenantId:
            'tenant-recovery',
          action:
            'RETRY',
          attemptNumber:
            3,
          message:
            'retry exhausted',
        });

        expect(
          publish,
        ).toHaveBeenCalledWith(
          'ai.recovery.failed',
          'core.ai.orchestration',
          expect.objectContaining({
            status:
              'FAILED',
          }),
        );
      },
    );
  },
);

  describe(
    'governance evidence',
    () => {

      it(
        'publishes approved decision evidence',
        async () => {

          const {
            service,
            publish,
          } = createService();

          await service.recordDecisionApproved({
            correlationId:
              'decision-approved',

            tenantId:
              'tenant',

            providerName:
              'openai',

            recommendation:
              'PRIMARY',

            confidence:
              0.95,

            status:
              'APPROVED',

            reason:
              'Governance accepted',

            auditRequired:
              true,

            rollbackRequired:
              true,

            recordedAt:
              new Date().toISOString(),
          });


          expect(
            publish,
          ).toHaveBeenCalledWith(
            'ai.decision.approved',
            'core.ai.orchestration',
            expect.objectContaining({
              status:
                'APPROVED',
            }),
          );
        },
      );


      it(
        'publishes approval required evidence',
        async () => {

          const {
            service,
            publish,
          } = createService();

          await service.recordDecisionRequiresApproval({
            correlationId:
              'decision-approval',

            tenantId:
              'tenant',

            providerName:
              'openai',

            recommendation:
              'PRIMARY',

            confidence:
              0.50,

            status:
              'REQUIRES_APPROVAL',

            reason:
              'Confidence below threshold',

            auditRequired:
              true,

            rollbackRequired:
              true,

            recordedAt:
              new Date().toISOString(),
          });


          expect(
            publish,
          ).toHaveBeenCalledWith(
            'ai.decision.requires_approval',
            'core.ai.orchestration',
            expect.objectContaining({
              status:
                'REQUIRES_APPROVAL',
            }),
          );
        },
      );


      it(
        'publishes blocked decision evidence',
        async () => {

          const {
            service,
            publish,
          } = createService();

          await service.recordDecisionBlocked({
            correlationId:
              'decision-blocked',

            tenantId:
              'tenant',

            providerName:
              'openai',

            recommendation:
              'AVOID',

            confidence:
              0.99,

            status:
              'BLOCKED',

            reason:
              'Policy denied',

            auditRequired:
              true,

            rollbackRequired:
              true,

            recordedAt:
              new Date().toISOString(),
          });


          expect(
            publish,
          ).toHaveBeenCalledWith(
            'ai.decision.blocked',
            'core.ai.orchestration',
            expect.objectContaining({
              status:
                'BLOCKED',
            }),
          );
        },
      );

    },
  );

});
