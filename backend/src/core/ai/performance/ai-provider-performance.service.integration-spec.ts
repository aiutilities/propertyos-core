import {
  describe,
  beforeEach,
  it,
  expect,
} from '@jest/globals';

import {
  AiRecoveryOutcomeRepository,
} from '../recovery/ai-recovery-outcome.repository';

import {
  AiProviderReliabilityService,
} from '../recovery/ai-provider-reliability.service';

import {
  AiProviderPerformanceService,
} from './ai-provider-performance.service';


describe(
  'AiProviderPerformanceService',
  () => {

    let repository:
      AiRecoveryOutcomeRepository;

    let service:
      AiProviderPerformanceService;


    beforeEach(
      () => {

        repository =
          new AiRecoveryOutcomeRepository();


        service =
          new AiProviderPerformanceService(
            repository,
            new AiProviderReliabilityService(
              repository,
            ),
          );
      },
    );


    it(
      'calculates provider performance profile',
      () => {

        repository.save({
          correlationId:
            'performance-1',

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

          latencyMs:
            2000,

          totalTokens:
            1000,

          recordedAt:
            new Date().toISOString(),
        });


        const profile =
          service.calculate(
            'openai',
          );


        expect(
          profile,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',

            totalExecutions:
              1,

            averageLatencyMs:
              2000,

            averageTokens:
              1000,
          }),
        );
      },
    );


    it(
      'returns zero performance for unknown provider',
      () => {

        expect(
          service.calculate(
            'unknown',
          ),
        ).toEqual(
          expect.objectContaining({
            totalExecutions:
              0,

            performanceScore:
              40,
          }),
        );

      },
    );

  },
);
