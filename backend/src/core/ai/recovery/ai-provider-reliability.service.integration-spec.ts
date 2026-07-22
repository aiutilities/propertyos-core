import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiRecoveryOutcomeRepository,
} from './ai-recovery-outcome.repository';

import {
  AiProviderReliabilityService,
} from './ai-provider-reliability.service';


describe(
  'AiProviderReliabilityService',
  () => {

    let repository:
      AiRecoveryOutcomeRepository;

    let service:
      AiProviderReliabilityService;


    beforeEach(
      () => {

        repository =
          new AiRecoveryOutcomeRepository();

        service =
          new AiProviderReliabilityService(
            repository,
          );

      },
    );


    it(
      'calculates provider success reliability',
      () => {

        repository.save({
          correlationId:
            '1',

          tenantId:
            'tenant',

          providerName:
            'openai',

          recoveryDecision:
            'RETRY',

          status:
            'SUCCEEDED',

          attemptNumber:
            1,

          recordedAt:
            new Date().toISOString(),
        });


        repository.save({
          correlationId:
            '2',

          tenantId:
            'tenant',

          providerName:
            'openai',

          recoveryDecision:
            'STOP',

          status:
            'FAILED',

          attemptNumber:
            1,

          recordedAt:
            new Date().toISOString(),
        });


        expect(
          service.calculate(
            'openai',
          ),
        ).toEqual(
          expect.objectContaining({
            totalExecutions:
              2,

            successfulExecutions:
              1,

            failedExecutions:
              1,

            successRate:
              0.5,
          }),
        );
      },
    );


    it(
      'returns zero reliability for unknown providers',
      () => {

        expect(
          service.calculate(
            'unknown',
          ),
        ).toEqual(
          expect.objectContaining({
            totalExecutions:
              0,

            healthScore:
              0,
          }),
        );

      },
    );

  },
);
