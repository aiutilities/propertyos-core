import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyOperationsIntelligenceService,
} from './property-operations-intelligence.service';


describe(
  'PropertyOperationsIntelligenceService',
  () => {


    it(
      'creates operational intelligence',
      async () => {

        const propertyService = {
          findPropertyById:
            async () => ({
              id:
                'property-001',

              name:
                'Advaiths Nest',
            }),
        } as any;


        const maintenanceService = {
          list:
            async () => [
              {
                id:
                  'm1',
              },
            ],
        } as any;


        const helpdeskService = {
          list:
            async () => [
              {
                id:
                  'h1',
              },
            ],
        } as any;


        const service =
          new PropertyOperationsIntelligenceService(
            propertyService,
            maintenanceService,
            helpdeskService,
          );


        const result =
          await service.analyzeProperty(
            'property-001',
          );


        expect(result)
          .toEqual(
            expect.objectContaining({

              propertyName:
                'Advaiths Nest',

              maintenanceOpenCount:
                1,

              helpdeskOpenCount:
                1,

              operationalRisk:
                'LOW',
            }),
          );
      },
    );

  },
);
