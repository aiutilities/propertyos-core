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
} from '../performance/ai-provider-performance.service';

import {
  AiProviderIntelligenceService,
} from './ai-provider-intelligence.service';


describe(
  'AiProviderIntelligenceService',
  () => {

    let repository:
      AiRecoveryOutcomeRepository;

    let service:
      AiProviderIntelligenceService;


    beforeEach(
      () => {

        repository =
          new AiRecoveryOutcomeRepository();


        service =
          new AiProviderIntelligenceService(
            new AiProviderReliabilityService(
              repository,
            ),

            new AiProviderPerformanceService(
              repository,

              new AiProviderReliabilityService(
                repository,
              ),
            ),
          );
      },
    );


    it(
      'creates unified provider intelligence profile',
      () => {

        repository.save({
          correlationId:
            'intel-1',

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
            1000,

          totalTokens:
            500,

          recordedAt:
            new Date().toISOString(),
        });


        const result =
          service.evaluate(
            'openai',
          );


        expect(
          result,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',

            recommendation:
              'PRIMARY',
          }),
        );
      },
    );


    it(
      'avoids unknown providers',
      () => {

        expect(
          service.evaluate(
            'unknown',
          ),
        ).toEqual(
          expect.objectContaining({
            recommendation:
              'AVOID',
          }),
        );

      },
    );

  },
);
