import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyActionGovernanceService,
} from './property-action-governance.service';

import {
  AiControlledAutonomyService,
} from '../governance/ai-controlled-autonomy.service';

import {
  AiAutonomousDecisionGuardService,
} from '../governance/ai-autonomous-decision-guard.service';

import {
  AiDecisionGovernanceService,
} from '../governance/ai-decision-governance.service';


describe(
  'PropertyActionGovernanceService',
  () => {


    it(
      'requires approval for property action',
      () => {


        const governance =
          new AiDecisionGovernanceService();


        const guard =
          new AiAutonomousDecisionGuardService(
            governance,
          );


        const autonomy =
          new AiControlledAutonomyService(
            guard,
          );


        const service =
          new PropertyActionGovernanceService(
            autonomy,
          );


        const result =
          service.evaluate({

            propertyId:
              'property-001',

            action:
              'REVIEW_MAINTENANCE',

            reason:
              'SLA breach',

            confidence:
              0.85,

            requiresApproval:
              true,

          });


        expect(
          result.decision.mode,
        )
          .toBe(
            'REQUEST_APPROVAL',
          );

      },
    );


  },
);
