import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiRecoveryOutcomeRepository,
} from './ai-recovery-outcome.repository';


describe(
  'AiRecoveryOutcomeRepository',
  () => {

    let repository:
      AiRecoveryOutcomeRepository;


    beforeEach(
      () => {
        repository =
          new AiRecoveryOutcomeRepository();
      },
    );


    it(
      'stores recovery outcomes',
      () => {

        repository.save({
          correlationId:
            'correlation-1',

          tenantId:
            'tenant-1',

          providerName:
            'openai',

          failureCode:
            'TIMEOUT',

          recoveryDecision:
            'RETRY',

          status:
            'SUCCEEDED',

          attemptNumber:
            1,

          recordedAt:
            new Date().toISOString(),
        });


        expect(
          repository.findAll(),
        ).toHaveLength(1);
      },
    );


    it(
      'finds outcomes by correlation id',
      () => {

        repository.save({
          correlationId:
            'correlation-target',

          tenantId:
            'tenant-1',

          recoveryDecision:
            'FALLBACK_PROVIDER',

          status:
            'FAILED',

          attemptNumber:
            2,

          recordedAt:
            new Date().toISOString(),
        });


        expect(
          repository.findByCorrelationId(
            'correlation-target',
          ),
        ).toHaveLength(1);
      },
    );

  },
);
