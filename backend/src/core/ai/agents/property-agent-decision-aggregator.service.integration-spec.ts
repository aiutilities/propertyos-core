import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyAgentDecisionAggregatorService,
} from './property-agent-decision-aggregator.service';


describe(
  'PropertyAgentDecisionAggregatorService',
  () => {


    it(
      'aggregates specialist recommendations',
      () => {


        const service =
          new PropertyAgentDecisionAggregatorService();


        const result =
          service.aggregate(

            'property-001',

            [
              {
                agentId:
                  'maintenance-agent',

                recommendation:
                  'CREATE_REPAIR_ACTION',

                confidence:
                  0.91,
              },

              {
                agentId:
                  'helpdesk-agent',

                recommendation:
                  'ESCALATE_TENANT_ISSUE',

                confidence:
                  0.82,
              },
            ],

          );


        expect(result.decision)
          .toBe(
            'CREATE_REPAIR_ACTION',
          );


        expect(result.contributingAgents)
          .toContain(
            'helpdesk-agent',
          );


        expect(result.confidence)
          .toBe(
            0.91,
          );

      },
    );


  },
);
