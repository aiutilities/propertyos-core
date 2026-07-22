import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyActionLifecycleService,
} from './property-action-lifecycle.service';

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

import {
  PropertyActionExecutionService,
} from './property-action-execution.service';


describe(
  'PropertyActionLifecycleService',
  () => {


    it(
      'moves proposal through governance and execution',
      () => {


        const governance =
          new PropertyActionGovernanceService(
            new AiControlledAutonomyService(
              new AiAutonomousDecisionGuardService(
                new AiDecisionGovernanceService(),
              ),
            ),
          );


        const service =
          new PropertyActionLifecycleService(

            governance,

            new PropertyActionExecutionService(),

          );


        const result =
          service.execute({

            propertyId:
              'property-001',

            action:
              'REVIEW_MAINTENANCE',

            reason:
              'High operational risk',

            confidence:
              0.95,

            requiresApproval:
              true,

          });


        expect(
          result.execution.status,
        )
        .toBe(
          'PENDING_APPROVAL',
        );

      },
    );


  },
);
