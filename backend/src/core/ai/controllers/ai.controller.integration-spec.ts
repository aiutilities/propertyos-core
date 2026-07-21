import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  GUARDS_METADATA,
} from '@nestjs/common/constants';
import {
  Permissions,
} from '../../auth/constants/permissions';
import {
  REQUIRED_PERMISSION_KEY,
} from '../../auth/decorators/require-permission.decorator';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';
import {
  AiController,
} from './ai.controller';

describe(
  'AiController secure orchestration boundary',
  () => {
    it(
      'requires JWT authentication and AI execution permission',
      () => {
        expect(
          Reflect.getMetadata(
            GUARDS_METADATA,
            AiController,
          ),
        ).toEqual([
          JwtAuthGuard,
          PermissionGuard,
        ]);

        for (
          const method of [
            'listProviders',
            'orchestrate',
          ] as const
        ) {
          expect(
            Reflect.getMetadata(
              REQUIRED_PERMISSION_KEY,
              AiController
                .prototype[method],
            ),
          ).toBe(
            Permissions.AI_EXECUTE,
          );
        }
      },
    );

    it(
      'lists providers through the provider service',
      () => {
        const providers = [
          {
            id: 'mock',
            name: 'mock',
          },
        ];

        const aiService = {
          listProviders:
            jest.fn(
              () => providers,
            ),
        };

        const controller =
          new AiController(
            aiService as never,
            {} as never,
          );

        expect(
          controller.listProviders(),
        ).toBe(providers);

        expect(
          aiService.listProviders,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'reconstructs a trusted orchestration request',
      async () => {
        const execute =
          jest.fn(
            async (
              request: unknown,
            ) => request,
          );

        const controller =
          new AiController(
            {} as never,
            {
              execute,
            } as never,
          );

        const result =
          await controller.orchestrate(
            {
              tenantId:
                'tenant-16a4',
              capability:
                'CHAT',
              executionMode:
                'SIMULATED',
              dataClassification:
                'INTERNAL',
              messages: [
                {
                  role: 'user',
                  content:
                    'Summarize the lease.',
                },
              ],
              providerName:
                'mock',
              model:
                'mock-model',
              temperature:
                0.2,
              maxTokens:
                200,
              tokenBudget: {
                maxInputTokens:
                  100,
                maxOutputTokens:
                  100,
                maxTotalTokens:
                  200,
              },
              costBudget: {
                maxEstimatedCostMinor:
                  0,
                currency:
                  'INR',
              },
              fallbackProviderNames: [
                'fallback',
              ],
              humanApprovalReference:
                'approval-16a4',
              timeoutMs:
                5_000,
              correlationId:
                'correlation-16a4',
              metadata: {
                source:
                  'controller-test',
              },
              attempts: [
                {
                  providerName:
                    'injected',
                },
              ],
              decision: {
                providerName:
                  'injected',
              },
              liveExecutionAuthorized:
                true,
              evidence: {
                status:
                  'SUCCEEDED',
              },
            } as never,
          );

        expect(
          execute,
        ).toHaveBeenCalledWith({
          tenantId:
            'tenant-16a4',
          capability:
            'CHAT',
          executionMode:
            'SIMULATED',
          dataClassification:
            'INTERNAL',
          messages: [
            {
              role: 'user',
              content:
                'Summarize the lease.',
            },
          ],
          providerName:
            'mock',
          model:
            'mock-model',
          temperature:
            0.2,
          maxTokens:
            200,
          tokenBudget: {
            maxInputTokens:
              100,
            maxOutputTokens:
              100,
            maxTotalTokens:
              200,
          },
          costBudget: {
            maxEstimatedCostMinor:
              0,
            currency:
              'INR',
          },
          fallbackProviderNames: [
            'fallback',
          ],
          humanApprovalReference:
            'approval-16a4',
          timeoutMs:
            5_000,
          correlationId:
            'correlation-16a4',
          metadata: {
            source:
              'controller-test',
          },
        });

        expect(result).not
          .toHaveProperty(
            'attempts',
          );

        expect(result).not
          .toHaveProperty(
            'decision',
          );

        expect(result).not
          .toHaveProperty(
            'liveExecutionAuthorized',
          );

        expect(result).not
          .toHaveProperty(
            'evidence',
          );
      },
    );

    it(
      'does not expose the legacy generate operation',
      () => {
        expect(
          (
            AiController
              .prototype as unknown as
              Record<
                string,
                unknown
              >
          ).generate,
        ).toBeUndefined();
      },
    );
  },
);
