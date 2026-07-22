import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiFailurePolicyService,
} from './ai-failure-policy.service';

describe(
  'AiFailurePolicyService',
  () => {
    let service: AiFailurePolicyService;

    beforeEach(() => {
      service =
        new AiFailurePolicyService();
    });

    it(
      'classifies provider timeout as fallback eligible',
      () => {
        expect(
          service.classify(
            'PROVIDER_TIMEOUT',
            true,
          ),
        ).toEqual({
          code:
            'PROVIDER_TIMEOUT',
          category:
            'TIMEOUT',
          severity:
            'MEDIUM',
          retriable:
            true,
          recoveryAction:
            'FALLBACK_PROVIDER',
        });
      },
    );

    it(
      'classifies budget failures as context reduction',
      () => {
        expect(
          service.classify(
            'TOKEN_BUDGET_EXCEEDED',
            false,
          ),
        ).toEqual({
          code:
            'TOKEN_BUDGET_EXCEEDED',
          category:
            'BUDGET',
          severity:
            'MEDIUM',
          retriable:
            false,
          recoveryAction:
            'REDUCE_CONTEXT',
        });
      },
    );

    it(
      'classifies authorization failures as non retryable',
      () => {
        expect(
          service.classify(
            'AI_AUTH_FAILED',
            false,
          ),
        ).toEqual({
          code:
            'AI_AUTH_FAILED',
          category:
            'AUTHORIZATION',
          severity:
            'HIGH',
          retriable:
            false,
          recoveryAction:
            'REQUEST_PERMISSION',
        });
      },
    );

    it(
      'keeps unknown failures safe',
      () => {
        expect(
          service.classify(
            'UNKNOWN_FAILURE',
            false,
          ),
        ).toEqual({
          code:
            'UNKNOWN_FAILURE',
          category:
            'UNKNOWN',
          severity:
            'HIGH',
          retriable:
            false,
          recoveryAction:
            'NONE',
        });
      },
    );
  },
);
