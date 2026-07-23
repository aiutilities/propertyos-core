import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiAgentNegotiationService,
} from './property-ai-agent-negotiation.service';


describe(
  'PropertyAiAgentNegotiationService',
  () => {


    it(
      'selects highest confidence proposal',
      () => {


        const service =
          new PropertyAiAgentNegotiationService();


        const result =
          service.negotiate(

            'property-001',

            [
              {
                agentId:
                  'maintenance-agent',

                recommendation:
                  'Review maintenance',

                confidence:
                  0.80,

                reasoning:
                  'Backlog high',
              },

              {
                agentId:
                  'finance-agent',

                recommendation:
                  'Review collections',

                confidence:
                  0.90,

                reasoning:
                  'Rent risk high',
              },
            ],
          );


        expect(
          result.selectedProposal.agentId,
        )
        .toBe(
          'finance-agent',
        );

      },
    );


  },
);
