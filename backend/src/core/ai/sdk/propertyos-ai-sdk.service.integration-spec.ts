import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AiOrchestrationError,
} from '../errors/ai-orchestration.error';
import {
  AiOrchestratorService,
} from '../services/ai-orchestrator.service';
import {
  AiOrchestrationResult,
} from '../types/ai-orchestration.types';
import {
  PROPERTYOS_AI_SDK_VERSION,
} from './ai-sdk.contracts';
import {
  PropertyOsAiSdkService,
} from './propertyos-ai-sdk.service';

describe(
  'PropertyOsAiSdkService',
  () => {
    function createSdk(
      execute:
        AiOrchestratorService['execute'],
    ) {
      const orchestrator = {
        execute:
          jest.fn(execute),
      } as unknown as
        AiOrchestratorService;

      return {
        sdk:
          new PropertyOsAiSdkService(
            orchestrator,
          ),
        orchestrator,
      };
    }

    it(
      'maps SDK requests to orchestration',
      async () => {
        const orchestrationResult:
          AiOrchestrationResult = {
            correlationId:
              'corr-sdk-1',
            response: {
              providerName:
                'mock',
              model:
                'mock-v1',
              content:
                'summary',
              usage: {
                inputTokens:
                  10,
                outputTokens:
                  5,
                totalTokens:
                  15,
              },
            },
            decision: {
              providerName:
                'mock',
              model:
                'mock-v1',
              capability:
                'SUMMARIZATION',
              executionMode:
                'SIMULATED',
              tenantId:
                'tenant-1',
              fallbackProviderNames:
                [],
              liveExecutionAuthorized:
                false,
            },
            attempts: [],
          };

        const {
          sdk,
          orchestrator,
        } = createSdk(
          async () =>
            orchestrationResult,
        );

        const result =
          await sdk.execute({
            tenantId:
              'tenant-1',
            moduleId:
              'maintenance',
            capability:
              'SUMMARIZATION',
            messages: [
              {
                role:
                  'user',
                content:
                  'Summarize this work order.',
              },
            ],
            correlationId:
              'corr-sdk-1',
          });

        expect(result).toEqual({
          ok: true,
          sdkVersion:
            PROPERTYOS_AI_SDK_VERSION,
          correlationId:
            'corr-sdk-1',
          content:
            'summary',
          providerName:
            'mock',
          model:
            'mock-v1',
          usage: {
            inputTokens:
              10,
            outputTokens:
              5,
            totalTokens:
              15,
          },
          raw:
            undefined,
          attempts:
            [],
        });

        expect(
          orchestrator.execute,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId:
              'tenant-1',
            capability:
              'SUMMARIZATION',
            executionMode:
              'SIMULATED',
            dataClassification:
              'INTERNAL',
            correlationId:
              'corr-sdk-1',
            metadata: {
              propertyOsAiSdkVersion:
                PROPERTYOS_AI_SDK_VERSION,
              propertyOsModuleId:
                'maintenance',
            },
          }),
        );
      },
    );

    it(
      'returns stable typed failures',
      async () => {
        const { sdk } =
          createSdk(async () => {
            throw new AiOrchestrationError({
              code:
                'ALL_PROVIDERS_FAILED',
              message:
                'No provider completed the request',
              retriable:
                false,
            });
          });

        const result =
          await sdk.execute({
            tenantId:
              'tenant-1',
            moduleId:
              'helpdesk',
            capability:
              'CLASSIFICATION',
            messages: [
              {
                role:
                  'user',
                content:
                  'Classify this ticket.',
              },
            ],
            correlationId:
              'corr-sdk-2',
          });

        expect(result).toEqual({
          ok: false,
          sdkVersion:
            PROPERTYOS_AI_SDK_VERSION,
          correlationId:
            'corr-sdk-2',
          error: {
            code:
              'ALL_PROVIDERS_FAILED',
            message:
              'No provider completed the request',
            retriable:
              false,
            details:
              {},
          },
        });
      },
    );

    it(
      'validates required fields',
      async () => {
        const {
          sdk,
          orchestrator,
        } = createSdk(
          async () => {
            throw new Error(
              'must not execute',
            );
          },
        );

        const result =
          await sdk.execute({
            tenantId:
              'tenant-1',
            moduleId:
              '',
            capability:
              'CHAT',
            messages:
              [],
            correlationId:
              'corr-sdk-3',
          });

        expect(result).toEqual({
          ok: false,
          sdkVersion:
            PROPERTYOS_AI_SDK_VERSION,
          correlationId:
            'corr-sdk-3',
          error: {
            code:
              'INVALID_SDK_REQUEST',
            message:
              'moduleId is required',
            retriable:
              false,
            details:
              {},
          },
        });

        expect(
          orchestrator.execute,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'supports exception-based integration',
      async () => {
        const { sdk } =
          createSdk(async () => {
            throw new AiOrchestrationError({
              code:
                'PROVIDER_TIMEOUT',
              message:
                'Provider timed out',
              retriable:
                true,
            });
          });

        await expect(
          sdk.executeOrThrow({
            tenantId:
              'tenant-1',
            moduleId:
              'documents',
            capability:
              'EXTRACTION',
            messages: [
              {
                role:
                  'user',
                content:
                  'Extract lease terms.',
              },
            ],
            correlationId:
              'corr-sdk-4',
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            name:
              'PropertyOsAiSdkError',
            code:
              'PROVIDER_TIMEOUT',
            retriable:
              true,
            correlationId:
              'corr-sdk-4',
          }),
        );
      },
    );
  },
);
