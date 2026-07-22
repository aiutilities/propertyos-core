import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentIdentityService,
} from './ai-agent-identity.service';


describe(
  'AiAgentIdentityService',
  () => {

    const service =
      new AiAgentIdentityService();


    const agent = {
      id:
        'maintenance-agent',

      name:
        'Maintenance Agent',

      description:
        'Handles maintenance assistance',

      capabilities:
        [
          'ticket_analysis',
          'vendor_recommendation',
        ],

      permissions:
        [
          'maintenance.read',
        ],

      autonomyLevel:
        'SUPERVISED' as const,

      status:
        'ACTIVE' as const,

      createdAt:
        '2026-07-22T00:00:00.000Z',
    };


    it(
      'creates agent identity',
      () => {

        expect(
          service.create(agent),
        ).toEqual(
          expect.objectContaining({
            id:
              'maintenance-agent',

            autonomyLevel:
              'SUPERVISED',
          }),
        );
      },
    );


    it(
      'allows registered capability',
      () => {

        expect(
          service.canExecute(
            agent,
            'ticket_analysis',
          ),
        ).toBe(true);
      },
    );


    it(
      'rejects missing capability',
      () => {

        expect(
          service.canExecute(
            agent,
            'payment_execution',
          ),
        ).toBe(false);
      },
    );


    it(
      'checks permissions',
      () => {

        expect(
          service.hasPermission(
            agent,
            'maintenance.read',
          ),
        ).toBe(true);
      },
    );

  },
);
