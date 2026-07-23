import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiOutcomeMemoryService,
} from './property-ai-outcome-memory.service';


describe(
  'PropertyAiOutcomeMemoryService',
  () => {


    it(
      'stores and retrieves AI outcomes',
      async () => {


        const records: any[] = [];

        const repository = {

          create:
            async (memory: any) => {
              records.push(memory);
              return memory;
            },

          findByProperty:
            async (propertyId: string) =>
              records.filter(
                item =>
                  item.propertyId === propertyId,
              ),

          findSuccessful:
            async (propertyId: string) =>
              records.filter(
                item =>
                  item.propertyId === propertyId
                  &&
                  item.executionStatus === 'SUCCESS',
              ),

          count:
            async () =>
              records.length,

        } as any;


        const service =
          new PropertyAiOutcomeMemoryService(
            repository,
          );


        service.record({

          id:
            'outcome-001',

          propertyId:
            'property-001',

          action:
            'REVIEW_MAINTENANCE',

          recommendationConfidence:
            0.90,

          executionStatus:
            'SUCCESS',

          impactScore:
            25,

          notes:
            'Maintenance backlog reduced',

          createdAt:
            new Date()
              .toISOString(),

        });


        service.record({

          id:
            'outcome-002',

          propertyId:
            'property-001',

          action:
            'REVIEW_RENT_COLLECTION',

          recommendationConfidence:
            0.85,

          executionStatus:
            'FAILED',

          impactScore:
            -10,

          notes:
            'Tenant response pending',

          createdAt:
            new Date()
              .toISOString(),

        });


        const history =
          await service.listByProperty(
            'property-001',
          );


        expect(
          history.length,
        )
        .toBe(
          2,
        );


        const successful =
          await service.findSuccessfulActions(
            'property-001',
          );


        expect(
          successful.length,
        )
        .toBe(
          1,
        );


        expect(
          successful[0].action,
        )
        .toBe(
          'REVIEW_MAINTENANCE',
        );


        expect(
          await service.count(),
        )
        .toBe(
          2,
        );

      },
    );


  },
);
