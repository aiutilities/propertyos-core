import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentCollaborationService,
} from './ai-agent-collaboration.service';


describe(
  'AiAgentCollaborationService',
  () => {


    const service =
      new AiAgentCollaborationService();


    const collaboration = {

      collaborationId:
        'property-health-report-001',

      objective:
        'Generate monthly property health report',

      coordinatorAgentId:
        'coordinator-agent',

      participatingAgents:
        [
          'maintenance-agent',
          'finance-agent',
          'support-agent',
        ],

      status:
        'CREATED' as const,

      createdAt:
        '2026-07-22T00:00:00.000Z',
    };


    it(
      'creates collaboration',
      () => {

        expect(
          service.create(
            collaboration,
          ),
        ).toEqual(
          expect.objectContaining({
            status:
              'CREATED',
          }),
        );
      },
    );


    it(
      'activates collaboration',
      () => {

        expect(
          service.activate(
            collaboration,
          ).status,
        ).toBe(
          'ACTIVE',
        );
      },
    );


    it(
      'completes collaboration',
      () => {

        expect(
          service.complete(
            collaboration,
          ),
        ).toEqual(
          expect.objectContaining({
            successful:
              true,

            status:
              'COMPLETED',
          }),
        );
      },
    );

  },
);
