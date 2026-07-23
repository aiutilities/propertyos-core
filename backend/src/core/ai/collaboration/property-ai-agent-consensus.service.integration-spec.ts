import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiAgentConsensusService,
} from './property-ai-agent-consensus.service';


describe(
  'PropertyAiAgentConsensusService',
  () => {


    it(
      'reaches consensus for aligned agents',
      () => {


        const service =
          new PropertyAiAgentConsensusService();


        const result =
          service.decide({

            propertyId:
              'property-001',

            selectedProposal:
              {

                agentId:
                  'maintenance-agent',

                recommendation:
                  'Review maintenance',

                confidence:
                  0.9,

                reasoning:
                  'High backlog',

              },

            proposals:
              [],

            agreementScore:
              0.9,

          });


        expect(
          result.decision,
        )
        .toBe(
          'CONSENSUS_REACHED',
        );

      },
    );


  },
);
