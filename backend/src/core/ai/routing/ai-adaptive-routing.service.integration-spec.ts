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
  AiAdaptiveRoutingService,
} from './ai-adaptive-routing.service';


describe(
  'AiAdaptiveRoutingService',
  () => {

    let repository:
      AiRecoveryOutcomeRepository;

    let service:
      AiAdaptiveRoutingService;


    beforeEach(
      () => {

        repository =
          new AiRecoveryOutcomeRepository();


        service =
          new AiAdaptiveRoutingService(
            new AiProviderReliabilityService(
              repository,
            ),
          );
      },
    );


    it(
      'prefers healthier providers',
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
            '3',

          tenantId:
            'tenant',

          providerName:
            'claude',

          recoveryDecision:
            'STOP',

          status:
            'FAILED',

          attemptNumber:
            1,

          recordedAt:
            new Date().toISOString(),
        });


        const result =
          service.selectBest(
            [
              'openai',
              'claude',
            ],
            'CHAT',
          );


        expect(
          result?.providerName,
        ).toBe(
          'openai',
        );

      },
    );


    it(
      'returns signals for unknown providers',
      () => {

        const signals =
          service.evaluate(
            [
              'unknown',
            ],
          );


        expect(
          signals[0],
        ).toEqual(
          expect.objectContaining({
            providerName:
              'unknown',

            reliabilityScore:
              0,
          }),
        );

      },
    );

  },
);
