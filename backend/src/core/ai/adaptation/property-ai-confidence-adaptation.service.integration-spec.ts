import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiConfidenceAdaptationService,
} from './property-ai-confidence-adaptation.service';

import {
  PropertyAiOutcomeMemoryService,
} from '../memory/property-ai-outcome-memory.service';


describe(
  'PropertyAiConfidenceAdaptationService',
  () => {


    it(
      'increases confidence based on successful history',
      async () => {


        const repository = {

          records: [],

          create:
            async function(memory: any) {

              this.records.push(memory);

              return memory;

            },

          findByProperty:
            async function(propertyId: string) {

              return this.records.filter(
                (item: any) =>
                  item.propertyId === propertyId,
              );

            },

          findSuccessful:
            async function(propertyId: string) {

              return this.records.filter(
                (item: any) =>
                  item.propertyId === propertyId
                  &&
                  item.executionStatus === 'SUCCESS',
              );

            },

          count:
            async function() {

              return this.records.length;

            },

        } as any;


        const memory =
          new PropertyAiOutcomeMemoryService(
            repository,
          );


        memory.record({

          id:'1',
          propertyId:'property-001',
          action:'REVIEW_MAINTENANCE',
          recommendationConfidence:0.8,
          executionStatus:'SUCCESS',
          impactScore:20,
          notes:'ok',
          createdAt:new Date().toISOString(),

        });


        memory.record({

          id:'2',
          propertyId:'property-001',
          action:'REVIEW_MAINTENANCE',
          recommendationConfidence:0.8,
          executionStatus:'SUCCESS',
          impactScore:30,
          notes:'ok',
          createdAt:new Date().toISOString(),

        });


        const service =
          new PropertyAiConfidenceAdaptationService(
            memory,
          );


        const result =
          await service.adjust(
            'property-001',
            'REVIEW_MAINTENANCE',
            0.8,
          );


        expect(
          result.adjustedConfidence,
        )
        .toBe(
          0.85,
        );


        expect(
          result.successRate,
        )
        .toBe(
          1,
        );

      },

    );

  },

);
