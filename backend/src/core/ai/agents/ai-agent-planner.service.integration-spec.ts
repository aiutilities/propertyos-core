import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentPlannerService,
} from './ai-agent-planner.service';


describe(
  'AiAgentPlannerService',
  () => {

    const service =
      new AiAgentPlannerService();


    it(
      'creates task plan from goal',
      () => {

        const plan =
          service.createPlan(
            'maintenance-agent',
            'Reduce pending tickets',
            [
              'ticket_analysis',
              'vendor_recommendation',
            ],
          );


        expect(plan).toEqual(
          expect.objectContaining({
            agentId:
              'maintenance-agent',

            goal:
              'Reduce pending tickets',

            status:
              'CREATED',
          }),
        );


        expect(
          plan.steps.length,
        ).toBe(2);
      },
    );


    it(
      'creates ordered execution steps',
      () => {

        const plan =
          service.createPlan(
            'finance-agent',
            'Analyse rent arrears',
            [
              'payment_analysis',
              'tenant_notification',
            ],
          );


        expect(
          plan.steps[0].order,
        ).toBe(1);


        expect(
          plan.steps[1].order,
        ).toBe(2);
      },
    );


    it(
      'moves plan to ready state',
      () => {

        const plan =
          service.createPlan(
            'support-agent',
            'Answer tenant queries',
            [
              'conversation_analysis',
            ],
          );


        expect(
          service.ready(plan).status,
        ).toBe(
          'READY',
        );
      },
    );

  },
);
