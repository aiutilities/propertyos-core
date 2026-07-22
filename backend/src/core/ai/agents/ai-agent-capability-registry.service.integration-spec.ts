import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentCapabilityRegistryService,
} from './ai-agent-capability-registry.service';


describe(
  'AiAgentCapabilityRegistryService',
  () => {

    const service =
      new AiAgentCapabilityRegistryService();


    const capability = {

      id:
        'maintenance.analysis',

      name:
        'Maintenance Analysis',

      description:
        'Analyses maintenance requests',

      category:
        'maintenance',

      requiredPermissions:
        [
          'maintenance.read',
        ],

      riskLevel:
        'LOW' as const,

      enabled:
        true,

      version:
        '1.0.0',
    };


    it(
      'registers capability',
      () => {

        expect(
          service.register(
            capability,
          ),
        ).toEqual(
          capability,
        );
      },
    );


    it(
      'retrieves capability',
      () => {

        expect(
          service.get(
            'maintenance.analysis',
          ),
        ).toEqual(
          capability,
        );
      },
    );


    it(
      'allows enabled capability',
      () => {

        expect(
          service.isAllowed(
            'maintenance.analysis',
          ),
        ).toBe(true);
      },
    );


    it(
      'blocks unknown capability',
      () => {

        expect(
          service.isAllowed(
            'unknown.capability',
          ),
        ).toBe(false);
      },
    );

  },
);
