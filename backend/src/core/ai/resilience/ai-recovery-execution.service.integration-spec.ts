import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiRecoveryExecutionService,
} from './ai-recovery-execution.service';

describe(
  'AiRecoveryExecutionService',
  () => {
    let service: AiRecoveryExecutionService;

    beforeEach(() => {
      service =
        new AiRecoveryExecutionService();
    });

    it(
      'accepts retry execution',
      () => {
        expect(
          service.execute({
            correlationId:
              'correlation-retry',
            tenantId:
              'tenant-1',
            action:
              'RETRY',
            attemptNumber:
              1,
            reason:
              'provider timeout',
          }),
        ).toEqual({
          status:
            'STARTED',
          action:
            'RETRY',
          correlationId:
            'correlation-retry',
          attemptNumber:
            1,
          message:
            'Recovery execution accepted',
        });
      },
    );

    it(
      'accepts fallback provider execution',
      () => {
        expect(
          service.execute({
            correlationId:
              'correlation-fallback',
            tenantId:
              'tenant-1',
            action:
              'FALLBACK_PROVIDER',
            attemptNumber:
              2,
            reason:
              'provider unavailable',
          }).status,
        ).toBe(
          'STARTED',
        );
      },
    );

    it(
      'stops safely',
      () => {
        expect(
          service.execute({
            correlationId:
              'correlation-stop',
            tenantId:
              'tenant-1',
            action:
              'STOP',
            attemptNumber:
              1,
            reason:
              'budget exhausted',
          }),
        ).toEqual({
          status:
            'STOPPED',
          action:
            'STOP',
          correlationId:
            'correlation-stop',
          attemptNumber:
            1,
          message:
            'Recovery execution stopped safely',
        });
      },
    );

    it(
      'rejects invalid attempt numbers',
      () => {
        expect(
          service.execute({
            correlationId:
              'correlation-invalid',
            tenantId:
              'tenant-1',
            action:
              'RETRY',
            attemptNumber:
              0,
            reason:
              'invalid',
          }),
        ).toEqual({
          status:
            'FAILED',
          action:
            'RETRY',
          correlationId:
            'correlation-invalid',
          attemptNumber:
            0,
          message:
            'Invalid recovery attempt number',
        });
      },
    );
  },
);
