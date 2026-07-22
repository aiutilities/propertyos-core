import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiRecoveryDecisionService,
} from './ai-recovery-decision.service';

describe(
  'AiRecoveryDecisionService',
  () => {
    let service: AiRecoveryDecisionService;

    beforeEach(() => {
      service =
        new AiRecoveryDecisionService();
    });

    it(
      'selects retry for retryable provider failures',
      () => {
        expect(
          service.decide({
            code:
              'PROVIDER_EXECUTION_FAILED',
            category:
              'PROVIDER',
            severity:
              'HIGH',
            recoveryAction:
              'RETRY',
            retriable:
              true,
          }),
        ).toEqual({
          decision:
            'RETRY',
          allowed:
            true,
          reason:
            'Failure is retry eligible',
        });
      },
    );

    it(
      'selects fallback for non retryable provider failures',
      () => {
        expect(
          service.decide({
            code:
              'PROVIDER_EXECUTION_FAILED',
            category:
              'PROVIDER',
            severity:
              'HIGH',
            recoveryAction:
              'FALLBACK_PROVIDER',
            retriable:
              false,
          }),
        ).toEqual({
          decision:
            'FALLBACK_PROVIDER',
          allowed:
            true,
          reason:
            'Failure requires alternate provider',
        });
      },
    );

    it(
      'selects context reduction for budget failures',
      () => {
        expect(
          service.decide({
            code:
              'TOKEN_BUDGET_EXCEEDED',
            category:
              'BUDGET',
            severity:
              'HIGH',
            recoveryAction:
              'REDUCE_CONTEXT',
            retriable:
              false,
          }),
        ).toEqual({
          decision:
            'REDUCE_CONTEXT',
          allowed:
            true,
          reason:
            'Budget failure requires context reduction',
        });
      },
    );

    it(
      'blocks authorization recovery',
      () => {
        expect(
          service.decide({
            code:
              'AI_AUTH_FAILED',
            category:
              'AUTHORIZATION',
            severity:
              'HIGH',
            recoveryAction:
              'REQUEST_PERMISSION',
            retriable:
              false,
          }),
        ).toEqual({
          decision:
            'REQUEST_PERMISSION',
          allowed:
            false,
          reason:
            'Authorization is required before continuation',
        });
      },
    );

    it(
      'stops unknown failures safely',
      () => {
        expect(
          service.decide({
            code:
              'UNKNOWN_FAILURE',
            category:
              'UNKNOWN',
            severity:
              'HIGH',
            recoveryAction:
              'NONE',
            retriable:
              false,
          }),
        ).toEqual({
          decision:
            'STOP',
          allowed:
            false,
          reason:
            'Failure cannot be safely recovered',
        });
      },
    );
  },
);
