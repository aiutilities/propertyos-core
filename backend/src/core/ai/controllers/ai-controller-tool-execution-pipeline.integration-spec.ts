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
  IdentityService,
} from '../../identity/services/identity.service';
import {
  AiProviderPort,
} from '../contracts/ai-provider.contract';
import {
  AiController,
} from './ai.controller';
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
  AiToolPort,
} from '../tools/contracts/ai-tool.contract';
import {
  AiToolExecutionService,
} from '../tools/execution/ai-tool-execution.service';
import {
  AiToolManifestValidator,
} from '../tools/manifest/ai-tool-manifest.validator';
import {
  AiToolCallCoordinatorService,
} from '../tools/orchestration/ai-tool-call-coordinator.service';
import {
  AiToolContinuationBoundaryService,
} from '../tools/orchestration/ai-tool-continuation-boundary.service';
import {
  AiToolContinuationCoordinatorService,
} from '../tools/orchestration/ai-tool-continuation-coordinator.service';
import {
  AiToolContinuationDispatchService,
} from '../tools/orchestration/ai-tool-continuation-dispatch.service';
import {
  AiToolContinuationExecutionService,
} from '../tools/orchestration/ai-tool-continuation-execution.service';
import {
  AiToolInteractionProjectionService,
} from '../tools/orchestration/ai-tool-interaction-projection.service';
import {
  AiToolOrchestrationDecisionService,
} from '../tools/orchestration/ai-tool-orchestration-decision.service';
import {
  AiToolOrchestrationLoopService,
} from '../tools/orchestration/ai-tool-orchestration-loop.service';
import {
  AiToolResponseNormalizationService,
} from '../tools/orchestration/ai-tool-response-normalization.service';
import {
  AiToolRegistry,
} from '../tools/registry/ai-tool.registry';
import {
  AiToolRuntimeContextService,
} from '../tools/runtime/ai-tool-runtime-context.service';
import {
  AiCapability,
  AiProvider,
  AiRequest,
  AiResponse,
} from '../types/ai.types';

class AuthenticatedToolPipelineProvider
implements AiProviderPort {
  readonly name =
    'authenticated-tool-pipeline';

  readonly displayName =
    'Authenticated Tool Pipeline Provider';

  readonly capabilities:
    AiCapability[] = [
      'CHAT',
      'TOOL_CALLING',
    ];

  private invocationCount = 0;

  get manifest():
    AiProviderManifest {
    return {
      manifestVersion:
        AI_PROVIDER_MANIFEST_VERSION,
      provider: {
        id:
          'test.authenticated-tool-pipeline',
        name:
          this.name,
        displayName:
          this.displayName,
        version:
          '1.0.0',
        vendor:
          'PropertyOS Test Suite',
        description:
          'Deterministic provider for authenticated tool pipeline integration',
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
            'authenticated-tool-model',
          displayName:
            'Authenticated Tool Model',
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
            true,
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
        this.name,
      name:
        this.name,
      displayName:
        this.displayName,
      status:
        'ACTIVE',
      capabilities:
        this.capabilities,
      defaultModel:
        'authenticated-tool-model',
    };
  }

  async generate(
    request: AiRequest,
  ): Promise<AiResponse> {
    this.invocationCount += 1;

    if (this.invocationCount === 1) {
      return {
        providerName:
          this.name,
        model:
          request.model,
        content:
          '',
        usage: {
          inputTokens:
            10,
          outputTokens:
            5,
          totalTokens:
            15,
        },
        raw: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call-property-19c3e5',
                    type: 'function',
                    function: {
                      name: 'property.lookup',
                      arguments: JSON.stringify({
                        propertyId: 'property-19c3e5',
                      }),
                    },
                  },
                ],
              },
              finish_reason: 'tool_calls',
            },
          ],
        },
      };
    }

    return {
      providerName:
        this.name,
      model:
        request.model,
      content:
        'Authenticated property property-19c3e5 resolved',
      usage: {
        inputTokens:
          14,
        outputTokens:
          7,
        totalTokens:
          21,
      },
      raw: {
        phase:
          '19C3E5',
        invocation:
          this.invocationCount,
        messageCount:
          request.messages.length,
      },
    };
  }
}

describe(
  'AI controller authenticated tool execution pipeline',
  () => {
    it(
      'executes from authenticated controller context through the real bounded tool loop',
      async () => {
        const identity = {
          listPersonRoles:
            jest.fn(
              async (
                actorId: string,
              ) => {
                expect(actorId)
                  .toBe(
                    'actor-phase-19c3e5',
                  );

                return [
                  {
                    id:
                      'role-phase-19c3e5',
                  },
                ];
              },
            ),
          listRolePermissions:
            jest.fn(
              async (
                roleId: string,
              ) => {
                expect(roleId)
                  .toBe(
                    'role-phase-19c3e5',
                  );

                return [
                  {
                    key:
                      'property.read',
                  },
                  {
                    key:
                      'ai.execute',
                  },
                  {
                    key:
                      'property.read',
                  },
                ];
              },
            ),
        };

        const toolExecute =
          jest.fn<
            AiToolPort['execute']
          >(
            async (
              input,
              context,
            ) => ({
              propertyId:
                (
                  input as {
                    propertyId:
                      string;
                  }
                ).propertyId,
              propertyName:
                'Advaith Nest',
              actorId:
                context.actorId,
              correlationId:
                context.correlationId,
            }),
          );

        const tool:
          AiToolPort = {
          manifest: {
            id:
              'property.lookup',
            name:
              'Property lookup',
            description:
              'Looks up a PropertyOS property',
            version:
              '1.0.0',
            inputSchema: {
              type:
                'object',
              properties: {
                propertyId: {
                  type:
                    'string',
                },
              },
              required: [
                'propertyId',
              ],
            },
            outputSchema: {
              type:
                'object',
            },
            requiredPermissions: [
              'property.read',
            ],
            sideEffect:
              'read',
          },
          execute:
            toolExecute,
        };

        const toolRegistry =
          new AiToolRegistry(
            new AiToolManifestValidator(),
          );

        toolRegistry.register(tool);

        const providerRegistry =
          new AiProviderRegistry();

        const provider =
          new AuthenticatedToolPipelineProvider();

        providerRegistry.register(
          provider,
        );

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

        const requestPreparation =
          new AiRequestPreparationService();

        const dispatchBoundary =
          new AiPreparedRequestDispatchBoundaryService();

        const executionCoordinator =
          new AiDispatchExecutionCoordinatorService(
            providerRegistry,
          );

        const executionContext =
          new AiExecutionContextService();

        const toolExecution =
          new AiToolExecutionService(
            toolRegistry,
          );

        const toolCallCoordinator =
          new AiToolCallCoordinatorService(
            toolExecution,
          );

        const continuationCoordinator =
          new AiToolContinuationCoordinatorService(
            toolCallCoordinator,
            new AiToolInteractionProjectionService(),
            new AiToolContinuationBoundaryService(),
            new AiToolContinuationDispatchService(
              dispatchBoundary,
            ),
            new AiToolContinuationExecutionService(
              executionContext,
              executionCoordinator,
            ),
          );

        const toolLoop =
          new AiToolOrchestrationLoopService(
            new AiToolResponseNormalizationService(),
            new AiToolOrchestrationDecisionService(),
            continuationCoordinator,
          );

        const orchestrator =
          new AiOrchestratorService(
            new AiRoutingPolicyService(
              providerRegistry,
            ),
            providerRegistry,
            new AiOrchestrationEvidenceService(
              eventBus,
              new AiFailurePolicyService(),
              new AiRecoveryDecisionService(),
            ),
            requestPreparation,
            dispatchBoundary,
            executionCoordinator,
            executionContext,
            new AiProviderFailoverService(),
            toolLoop,
          );

        const controller =
          new AiController(
            {} as never,
            orchestrator,
            new AiToolRuntimeContextService(
              identity as unknown as
                IdentityService,
            ),
          );

        const result =
          await controller.orchestrate(
            {
              tenantId:
                'tenant-phase-19c3e5',
              capability:
                'TOOL_CALLING',
              executionMode:
                'SIMULATED',
              dataClassification:
                'INTERNAL',
              messages: [
                {
                  role:
                    'user',
                  content:
                    'Find property property-19c3e5.',
                },
              ],
              providerName:
                provider.name,
              model:
                'authenticated-tool-model',
              correlationId:
                'correlation-phase-19c3e5',
              tokenBudget: {
                maxTotalTokens:
                  100,
              },
              metadata: {
                phase:
                  '19C3E5',
              },
            },
            {
              sub:
                'actor-phase-19c3e5',
              email:
                'actor@example.com',
              displayName:
                'Actor Phase 19C3E5',
              iat:
                1_900_000_000,
              exp:
                2_000_000_000,
            },
          );

        expect(
          result.response.content,
        ).toBe(
          'Authenticated property property-19c3e5 resolved',
        );

        expect(
          result.response.providerName,
        ).toBe(
          provider.name,
        );

        expect(
          result.loop,
        ).toEqual(
          expect.objectContaining({
            outcome:
              'TERMINAL',
            completedContinuationRounds:
              1,
            normalizedToolCallCount:
              1,
            executedToolCallCount:
              1,
            succeededToolCallCount:
              1,
            failedToolCallCount:
              0,
          }),
        );

        expect(
          result.attempts,
        ).toHaveLength(1);

        expect(
          toolExecute,
        ).toHaveBeenCalledTimes(
          1,
        );

        const toolCall =
          toolExecute.mock.calls[0];

        expect(toolCall).toBeDefined();

        const [
          toolInput,
          runtimeContext,
        ] = toolCall;

        expect(toolInput).toEqual({
          propertyId:
            'property-19c3e5',
        });

        expect(runtimeContext.actorId).toBe(
          'actor-phase-19c3e5',
        );

        expect(runtimeContext.correlationId).toBe(
          'correlation-phase-19c3e5',
        );

        expect(runtimeContext.permissions).toEqual([
          'ai.execute',
          'property.read',
        ]);

        expect(
          identity.listPersonRoles,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          identity.listRolePermissions,
        ).toHaveBeenCalledTimes(
          1,
        );

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
                'correlation-phase-19c3e5',
              status:
                'REQUESTED',
              selectedProviderName:
                provider.name,
            }),
          );

        expect(publish)
          .toHaveBeenNthCalledWith(
            2,
            'ai.orchestration.succeeded',
            'core.ai.orchestration',
            expect.objectContaining({
              correlationId:
                'correlation-phase-19c3e5',
              status:
                'SUCCEEDED',
              selectedProviderName:
                provider.name,
              loop:
                expect.objectContaining({
                  completedContinuationRounds:
                    1,
                  executedToolCallCount:
                    1,
                  succeededToolCallCount:
                    1,
                }),
            }),
          );
      },
    );
  },
);
