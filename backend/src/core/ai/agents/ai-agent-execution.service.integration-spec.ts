import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentExecutionService,
} from './ai-agent-execution.service';

import {
  AiAgentIdentityService,
} from './ai-agent-identity.service';

import {
  AiAgentCapabilityRegistryService,
} from './ai-agent-capability-registry.service';


describe(
  'AiAgentExecutionService',
  () => {


    const registry =
      new AiAgentCapabilityRegistryService();


    registry.register({
      id:
        'ticket_analysis',

      name:
        'Ticket Analysis',

      description:
        'Analyse tickets',

      category:
        'maintenance',

      requiredPermissions:
        [
          'maintenance.read',
        ],

      riskLevel:
        'LOW',

      enabled:
        true,

      version:
        '1.0.0',
    });


    const service =
      new AiAgentExecutionService(
        new AiAgentIdentityService(),
        registry,
      );


    const agent = {

      id:
        'maintenance-agent',

      name:
        'Maintenance Agent',

      description:
        'Maintenance automation',

      capabilities:
        [
          'ticket_analysis',
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
        new Date().toISOString(),
    };


    it(
      'executes valid capability',
      () => {

        expect(
          service.execute(
            agent,
            {
              agentId:
                agent.id,

              planId:
                'plan-1',

              capabilityId:
                'ticket_analysis',

              stepOrder:
                1,
            },
          ),
        ).toEqual(
          expect.objectContaining({
            success:
              true,

            status:
              'EXECUTED',
          }),
        );
      },
    );


    it(
      'blocks unknown capability',
      () => {

        expect(
          service.execute(
            agent,
            {
              agentId:
                agent.id,

              planId:
                'plan-2',

              capabilityId:
                'payment_execution',

              stepOrder:
                1,
            },
          ),
        ).toEqual(
          expect.objectContaining({
            success:
              false,

            status:
              'BLOCKED',
          }),
        );
      },
    );


  },
);
