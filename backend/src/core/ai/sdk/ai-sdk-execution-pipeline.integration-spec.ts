import { AiFailurePolicyService } from '../resilience/ai-failure-policy.service';
import { AiRecoveryDecisionService } from '../resilience/ai-recovery-decision.service';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';
import {
  AiProviderPort,
} from '../contracts/ai-provider.contract';
import {
  AiDispatchExecutionCoordinatorService,
} from '../dispatch/ai-dispatch-execution-coordinator.service';
import {
  AiPreparedRequestDispatchBoundaryService,
} from '../dispatch/ai-prepared-request-dispatch-boundary.service';
import {
  AiExecutionContextService,
} from '../execution/ai-execution-context.service';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
} from '../manifest/ai-provider-manifest';
import {
  AiProviderRegistry,
} from '../registry/ai-provider.registry';
import {
  AiProviderFailoverService,
} from '../resilience/ai-provider-failover.service';
import {
  AiRequestPreparationService,
} from '../request/ai-request-preparation.service';
import {
  AiOrchestrationEvidenceService,
} from '../services/ai-orchestration-evidence.service';
import {
  AiOrchestratorService,
} from '../services/ai-orchestrator.service';
import {
  AiRoutingPolicyService,
} from '../services/ai-routing-policy.service';
import {
  AiToolOrchestrationLoopService,
} from '../tools/orchestration/ai-tool-orchestration-loop.service';
import {
  AiCapability,
  AiProvider,
  AiRequest,
  AiResponse,
} from '../types/ai.types';
import {
  PROPERTYOS_AI_SDK_VERSION,
} from './ai-sdk.contracts';
import {
  PropertyOsAiSdkService,
} from './propertyos-ai-sdk.service';

class PipelineAiProvider implements AiProviderPort {
  readonly name =
    'pipeline';

  readonly displayName =
    'Pipeline AI Provider';

  readonly capabilities:
    AiCapability[] = [
      'CHAT',
      'SUMMARIZATION',
    ];

  get manifest():
    AiProviderManifest {
    return {
      manifestVersion:
        AI_PROVIDER_MANIFEST_VERSION,
      provider: {
        id:
          'test.pipeline',
        name:
          'pipeline',
        displayName:
          this.displayName,
        version:
          '1.0.0',
        vendor:
          'PropertyOS Test Suite',
        description:
          'Deterministic provider for SDK pipeline integration',
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
            'pipeline-model',
          displayName:
            'Pipeline Model',
          contextWindow:
            8_192,
          maxInputTokens:
            6_144,
          maxOutputTokens:
            2_048,
          supportsStreaming:
            false,
          supportsVision:
            false,
          supportsToolCalling:
            false,
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

  getProvider():
    AiProvider {
    return {
      id:
        'pipeline',
      name:
        'pipeline',
      displayName:
        this.displayName,
      status:
        'ACTIVE',
      capabilities:
        this.capabilities,
      defaultModel:
        'pipeline-model',
    };
  }

  async generate(
    request: AiRequest,
  ): Promise<AiResponse> {
    return {
      providerName:
        'pipeline',
      model:
        request.model,
      content:
        `Pipeline processed ${request.messages.length} message`,
      usage: {
        inputTokens:
          8,
        outputTokens:
          4,
        totalTokens:
          12,
      },
      raw: {
        fixture:
          'phase-19c3e4',
      },
    };
  }
}

describe(
  'PropertyOS AI SDK execution pipeline',
  () => {
    it(
      'executes through the real orchestration pipeline and records evidence',
      async () => {
        const registry =
          new AiProviderRegistry();

        const provider =
          new PipelineAiProvider();

        registry.register(provider);

        const publish =
          jest.fn<
            EventBusService['publish']
          >(
            async () => undefined,
          );

        const eventBus = {
          publish,
        } as unknown as
          EventBusService;

        const toolLoopExecute =
          jest.fn<
            AiToolOrchestrationLoopService['execute']
          >();

        const toolLoop = {
          execute:
            toolLoopExecute,
        } as unknown as
          AiToolOrchestrationLoopService;

        const orchestrator =
          new AiOrchestratorService(
            new AiRoutingPolicyService(
              registry,
            ),
            registry,
            new AiOrchestrationEvidenceService(
              eventBus,
              new AiFailurePolicyService(),
              new AiRecoveryDecisionService(),
            ),
            new AiRequestPreparationService(),
            new AiPreparedRequestDispatchBoundaryService(),
            new AiDispatchExecutionCoordinatorService(
              registry,
            ),
            new AiExecutionContextService(),
            new AiProviderFailoverService(),
            toolLoop,
          );

        const sdk =
          new PropertyOsAiSdkService(
            orchestrator,
          );

        const result =
          await sdk.execute({
            tenantId:
              'tenant-phase-19c3e4',
            moduleId:
              'maintenance',
            capability:
              'SUMMARIZATION',
            providerName:
              'pipeline',
            model:
              'pipeline-model',
            executionMode:
              'SIMULATED',
            dataClassification:
              'INTERNAL',
            messages: [
              {
                role:
                  'user',
                content:
                  'Summarize this maintenance request.',
              },
            ],
            correlationId:
              'correlation-phase-19c3e4',
            tokenBudget: {
              maxTotalTokens:
                100,
            },
            metadata: {
              phase:
                '19C3E4',
            },
          });

        expect(result).toEqual({
          ok:
            true,
          sdkVersion:
            PROPERTYOS_AI_SDK_VERSION,
          correlationId:
            'correlation-phase-19c3e4',
          content:
            'Pipeline processed 1 message',
          providerName:
            'pipeline',
          model:
            'pipeline-model',
          usage: {
            inputTokens:
              8,
            outputTokens:
              4,
            totalTokens:
              12,
          },
          raw: {
            fixture:
              'phase-19c3e4',
          },
          attempts: [
            {
              providerName:
                'pipeline',
              attempt:
                1,
              status:
                'SUCCEEDED',
              startedAt:
                expect.any(String),
              completedAt:
                expect.any(String),
              durationMs:
                expect.any(Number),
            },
          ],
        });

        expect(
          toolLoopExecute,
        ).not.toHaveBeenCalled();

        expect(publish)
          .toHaveBeenCalledTimes(
            2,
          );

        expect(publish)
          .toHaveBeenNthCalledWith(
            1,
            'ai.orchestration.requested',
            'core.ai.orchestration',
            expect.objectContaining({
              correlationId:
                'correlation-phase-19c3e4',
              status:
                'REQUESTED',
              selectedProviderName:
                'pipeline',
              metadata:
                expect.objectContaining({
                  phase:
                    '19C3E4',
                  propertyOsAiSdkVersion:
                    PROPERTYOS_AI_SDK_VERSION,
                  propertyOsModuleId:
                    'maintenance',
                }),
            }),
          );

        expect(publish)
          .toHaveBeenNthCalledWith(
            2,
            'ai.orchestration.succeeded',
            'core.ai.orchestration',
            expect.objectContaining({
              correlationId:
                'correlation-phase-19c3e4',
              status:
                'SUCCEEDED',
              selectedProviderName:
                'pipeline',
              usage: {
                inputTokens:
                  8,
                outputTokens:
                  4,
                totalTokens:
                  12,
              },
              attempts: [
                expect.objectContaining({
                  providerName:
                    'pipeline',
                  attempt:
                    1,
                  status:
                    'SUCCEEDED',
                }),
              ],
            }),
          );

        const succeededEvidence =
          publish.mock.calls[1]?.[2];

        expect(
          succeededEvidence,
        ).not.toHaveProperty(
          'requestId',
        );

        expect(
          succeededEvidence,
        ).not.toHaveProperty(
          'toolContext',
        );

        expect(
          succeededEvidence,
        ).not.toHaveProperty(
          'rounds',
        );
      },
    );
  },
);
