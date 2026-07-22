import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyOperationsAgentService,
} from './property-operations-agent.service';


describe(
  'PropertyOperationsAgentService',
  () => {


    it(
      'creates property operational insight',
      async () => {


        const intelligence = {

          analyzeProperty:
            async () => ({

              propertyId:
                'property-001',

              propertyName:
                'Advaiths Nest',

              maintenanceOpenCount:
                2,

              helpdeskOpenCount:
                1,

              operationalRisk:
                'LOW',
            }),
        } as any;


        const service =
          new PropertyOperationsAgentService(
            intelligence,
          );


        const result =
          await service.analyze(
            'property-001',
          );


        expect(result)
          .toEqual(
            expect.objectContaining({

              propertyName:
                'Advaiths Nest',

              healthStatus:
                'HEALTHY',
            }),
          );
      },
    );


    it(
      'raises warning for operational risk',
      async () => {


        const intelligence = {

          analyzeProperty:
            async () => ({

              propertyId:
                'property-001',

              propertyName:
                'Advaiths Nest',

              maintenanceOpenCount:
                8,

              helpdeskOpenCount:
                3,

              operationalRisk:
                'MEDIUM',
            }),
        } as any;


        const service =
          new PropertyOperationsAgentService(
            intelligence,
          );


        const result =
          await service.analyze(
            'property-001',
          );


        expect(result.healthStatus)
          .toBe(
            'WARNING',
          );
      },
    );


  },
);
