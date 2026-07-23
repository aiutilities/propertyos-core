import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiAgentGoalService,
} from './property-ai-agent-goal.service';


describe(
  'PropertyAiAgentGoalService',
  () => {


    it(
      'creates and manages agent goals',
      () => {

        const service =
          new PropertyAiAgentGoalService();


        service.create({

          id:
            'goal-001',

          agentId:
            'operations-agent',

          propertyId:
            'property-001',

          goal:
            'Reduce maintenance backlog',

          priority:
            'HIGH',

          status:
            'CREATED',

          createdAt:
            new Date()
              .toISOString(),

        });


        service.activate(
          'goal-001',
        );


        const goals =
          service.list(
            'property-001',
          );


        expect(
          goals.length,
        )
        .toBe(
          1,
        );


        expect(
          goals[0].status,
        )
        .toBe(
          'ACTIVE',
        );

      },
    );


  },
);
