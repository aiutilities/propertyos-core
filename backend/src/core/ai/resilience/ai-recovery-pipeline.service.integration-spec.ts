import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiFailurePolicyService,
} from './ai-failure-policy.service';

import {
  AiRecoveryDecisionService,
} from './ai-recovery-decision.service';

import {
  AiRecoveryBudgetService,
} from './ai-recovery-budget.service';

import {
  AiRecoveryCoordinatorService,
} from './ai-recovery-coordinator.service';

import {
  AiRecoveryExecutionService,
} from './ai-recovery-execution.service';

import {
  AiOrchestrationEvidenceService,
} from '../services/ai-orchestration-evidence.service';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  jest,
} from '@jest/globals';

import {
  AiRecoveryPipelineService,
} from './ai-recovery-pipeline.service';

describe(
  'AiRecoveryPipelineService',
  () => {

    let service:
      AiRecoveryPipelineService;

    let events:
      unknown[];

    let publish:
      jest.Mock;

    beforeEach(
      () => {
        events = [];

        publish =
          jest.fn(
            async (
              eventName,
              source,
              payload,
            ) => {
              events.push({
                eventName,
                source,
                payload,
              });
            },
          );

        service =
          new AiRecoveryPipelineService(
            new AiFailurePolicyService(),
            new AiRecoveryDecisionService(),
            new AiRecoveryCoordinatorService(
              new AiRecoveryBudgetService(),
            ),
            new AiRecoveryExecutionService(),
            new AiOrchestrationEvidenceService(
              {
                publish,
              } as unknown as EventBusService,
              new AiFailurePolicyService(),
              new AiRecoveryDecisionService(),
            ),
          );
      },
    );

    it(
      'executes fallback recovery pipeline',
      async () => {
        expect(
          await service.execute({
            failureCode:
              'PROVIDER_EXECUTION_FAILED',
            retriable:
              true,
            attemptsUsed:
              0,
            maxAttempts:
              3,
            correlationId:
              'correlation-pipeline-1',
            tenantId:
              'tenant-pipeline',
          }),
        ).toEqual({
          success:
            true,
          decision:
            'RETRY',
          executionStatus:
            'STARTED',
          reason:
            'Recovery execution accepted',
        });
      },
    );

    it(
      'stops when recovery budget is exhausted',
      async () => {
        expect(
          await service.execute({
            failureCode:
              'PROVIDER_EXECUTION_FAILED',
            retriable:
              true,
            attemptsUsed:
              3,
            maxAttempts:
              3,
            correlationId:
              'correlation-pipeline-2',
            tenantId:
              'tenant-pipeline',
          }),
        ).toEqual({
          success:
            false,
          decision:
            'RETRY',
          executionStatus:
            'STOPPED',
          reason:
            'Recovery budget exhausted',
        });
      },
    );
  },
);
