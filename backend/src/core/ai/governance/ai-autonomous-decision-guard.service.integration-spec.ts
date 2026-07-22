import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiDecisionGovernanceService,
} from './ai-decision-governance.service';

import {
  AiAutonomousDecisionGuardService,
} from './ai-autonomous-decision-guard.service';


describe(
  'AiAutonomousDecisionGuardService',
  () => {

    const service =
      new AiAutonomousDecisionGuardService(
        new AiDecisionGovernanceService(),
      );


    const policy = {
      tenantId:
        'tenant-1',

      minimumConfidence:
        0.8,

      allowedRecommendations:
        [
          'PRIMARY',
        ],

      approvalMode:
        'AUTONOMOUS' as const,

      auditRequired:
        true,

      rollbackRequired:
        true,
    };


    it(
      'allows autonomous execution',
      () => {

        expect(
          service.evaluate(
            'openai',

            'PRIMARY',

            0.95,

            policy,
          ),
        ).toEqual(
          expect.objectContaining({
            allowed:
              true,

            mode:
              'EXECUTE',
          }),
        );

      },
    );


    it(
      'requests approval for low confidence',
      () => {

        expect(
          service.evaluate(
            'openai',

            'PRIMARY',

            0.5,

            policy,
          ),
        ).toEqual(
          expect.objectContaining({
            allowed:
              false,

            mode:
              'REQUEST_APPROVAL',
          }),
        );

      },
    );


    it(
      'blocks unsafe recommendations',
      () => {

        expect(
          service.evaluate(
            'openai',

            'AVOID',

            0.99,

            policy,
          ),
        ).toEqual(
          expect.objectContaining({
            allowed:
              false,

            mode:
              'BLOCK',
          }),
        );

      },
    );

  },
);
