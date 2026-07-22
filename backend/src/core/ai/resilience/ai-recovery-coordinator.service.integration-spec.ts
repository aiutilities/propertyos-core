import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiRecoveryCoordinatorService,
} from './ai-recovery-coordinator.service';

import {
  AiRecoveryBudgetService,
} from './ai-recovery-budget.service';

describe(
  'AiRecoveryCoordinatorService',
  () => {
    let service: AiRecoveryCoordinatorService;

    beforeEach(() => {
      service =
        new AiRecoveryCoordinatorService(
          new AiRecoveryBudgetService(),
        );
    });

    it(
      'approves allowed retry recovery',
      () => {
        expect(
          service.coordinate(
            {
              decision:
                'RETRY',
              allowed:
                true,
              reason:
                'retry allowed',
            },
            {
              correlationId:
                'correlation-19d3',
              tenantId:
                'tenant-1',
              attemptCount:
                0,
              maxAttempts:
                3,
            },
          ),
        ).toEqual({
          plan: {
            decision:
              'RETRY',
            allowed:
              true,
            reason:
              'retry allowed',
          },
          approved:
            true,
          executable:
            true,
          reason:
            'Recovery action approved',
        });
      },
    );

    it(
      'blocks disallowed recovery',
      () => {
        expect(
          service.coordinate(
            {
              decision:
                'REQUEST_PERMISSION',
              allowed:
                false,
              reason:
                'permission required',
            },
            {
              correlationId:
                'correlation-19d3',
              tenantId:
                'tenant-1',
              attemptCount:
                0,
              maxAttempts:
                3,
            },
          ),
        ).toEqual({
          plan: {
            decision:
              'REQUEST_PERMISSION',
            allowed:
              false,
            reason:
              'permission required',
          },
          approved:
            false,
          executable:
            false,
          reason:
            'Recovery plan is not allowed',
        });
      },
    );

    it(
      'blocks recovery after attempt limit',
      () => {
        expect(
          service.coordinate(
            {
              decision:
                'RETRY',
              allowed:
                true,
              reason:
                'retry allowed',
            },
            {
              correlationId:
                'correlation-19d3',
              tenantId:
                'tenant-1',
              attemptCount:
                3,
              maxAttempts:
                3,
            },
          ),
        ).toEqual({
          plan: {
            decision:
              'RETRY',
            allowed:
              true,
            reason:
              'retry allowed',
          },
          approved:
            false,
          executable:
            false,
          reason:
            'Recovery budget exhausted',
        });
      },
    );

    it(
      'does not execute STOP decisions',
      () => {
        expect(
          service.coordinate(
            {
              decision:
                'STOP',
              allowed:
                true,
              reason:
                'stop',
            },
            {
              correlationId:
                'correlation-19d3',
              tenantId:
                'tenant-1',
              attemptCount:
                0,
              maxAttempts:
                3,
            },
          ),
        ).toEqual({
          plan: {
            decision:
              'STOP',
            allowed:
              true,
            reason:
              'stop',
          },
          approved:
            true,
          executable:
            false,
          reason:
            'Recovery action approved',
        });
      },
    );
  },
);
