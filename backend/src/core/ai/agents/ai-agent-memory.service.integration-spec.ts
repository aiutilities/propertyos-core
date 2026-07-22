import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  AiAgentMemoryService,
} from './ai-agent-memory.service';


describe(
  'AiAgentMemoryService',
  () => {


    const service =
      new AiAgentMemoryService();


    const memory = {

      id:
        'memory-001',

      agentId:
        'maintenance-agent',

      memoryType:
        'EXPERIENCE' as const,

      key:
        'vendor_delay_pattern',

      value:
        'Vendor ABC usually delays repairs',

      createdAt:
        '2026-07-22T00:00:00.000Z',
    };


    it(
      'stores agent memory',
      () => {

        expect(
          service.store(memory),
        ).toEqual(
          memory,
        );
      },
    );


    it(
      'finds memory by key',
      () => {

        expect(
          service.find(
            'maintenance-agent',
            'vendor_delay_pattern',
          ),
        ).toEqual(
          memory,
        );
      },
    );


    it(
      'filters memory by type',
      () => {

        expect(
          service.list(
            'maintenance-agent',
            'EXPERIENCE',
          ).length,
        ).toBe(1);
      },
    );


    it(
      'clears agent memory',
      () => {

        service.clear(
          'maintenance-agent',
        );


        expect(
          service.list(
            'maintenance-agent',
          ).length,
        ).toBe(0);
      },
    );

  },
);
