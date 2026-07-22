import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiRecoveryBudgetService,
} from './ai-recovery-budget.service';

describe(
  'AiRecoveryBudgetService',
  () => {
    let service: AiRecoveryBudgetService;

    beforeEach(() => {
      service =
        new AiRecoveryBudgetService();
    });

    it(
      'allows recovery when budget remains',
      () => {
        expect(
          service.evaluate({
            maxAttempts:
              3,
            attemptsUsed:
              1,
          }),
        ).toEqual({
          allowed:
            true,
          remainingAttempts:
            2,
          reason:
            'Recovery budget available',
        });
      },
    );

    it(
      'blocks recovery when budget is exhausted',
      () => {
        expect(
          service.evaluate({
            maxAttempts:
              3,
            attemptsUsed:
              3,
          }),
        ).toEqual({
          allowed:
            false,
          remainingAttempts:
            0,
          reason:
            'Recovery budget exhausted',
        });
      },
    );

    it(
      'blocks recovery when attempts exceed budget',
      () => {
        expect(
          service.evaluate({
            maxAttempts:
              3,
            attemptsUsed:
              5,
          }),
        ).toEqual({
          allowed:
            false,
          remainingAttempts:
            0,
          reason:
            'Recovery budget exhausted',
        });
      },
    );
  },
);
