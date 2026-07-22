import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentCollaborationService,
} from '../collaboration/ai-agent-collaboration.service';

import {
  PropertyAgentCollaborationService,
} from './property-agent-collaboration.service';


describe(
  'PropertyAgentCollaborationService',
  () => {


    it(
      'coordinates specialist agents',
      () => {


        const service =
          new PropertyAgentCollaborationService(
            new AiAgentCollaborationService(),
          );


        const result =
          service.collaborate({

            propertyId:
              'property-001',

            objective:
              'Analyze water leakage risk',

            coordinatorAgentId:
              'property-operations-agent',

            specialistAgentIds:
              [
                'maintenance-agent',
                'helpdesk-agent',
              ],

          });


        expect(result.successful)
          .toBe(true);


        expect(result.participatingAgents)
          .toContain(
            'maintenance-agent',
          );

      },
    );


  },
);
