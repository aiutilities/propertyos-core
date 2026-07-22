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

import {
  AiControlledAutonomyService,
} from './ai-controlled-autonomy.service';


describe(
  'AiControlledAutonomyService',
  () => {

    const service =
      new AiControlledAutonomyService(
        new AiAutonomousDecisionGuardService(
          new AiDecisionGovernanceService(),
        ),
      );


    const policy = {
      tenantId:
        'tenant-controlled',

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
      'executes approved autonomous decision',
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
            executed:
              true,

            evidenceEvent:
              'ai.decision.approved',
          }),
        );
      },
    );


    it(
      'requests approval for uncertain decision',
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
            executed:
              false,

            evidenceEvent:
              'ai.decision.requires_approval',
          }),
        );
      },
    );


    it(
      'blocks unsafe decision',
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
            executed:
              false,

            evidenceEvent:
              'ai.decision.blocked',
          }),
        );
      },
    );

  },
);
