import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyOperationsIntelligenceService,
} from './property-operations-intelligence.service';

import {
  MaintenanceRiskAnalyzerService,
} from './maintenance-risk-analyzer.service';

import {
  HelpdeskRiskAnalyzerService,
} from './helpdesk-risk-analyzer.service';

import {
  PropertyRiskAggregationService,
} from './property-risk-aggregation.service';

import {
  PropertyHealthAdvisoryService,
} from './property-health-advisory.service';


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


        const inventoryService = {

          listStockBalances:
            async () => [],

        } as any;


        const inventoryRiskAnalyzer = {

          analyze:
            () => [],

        } as any;


        const service =
          new PropertyOperationsIntelligenceService(
            propertyService,
            maintenanceService,
            helpdeskService,
            inventoryService,
            new MaintenanceRiskAnalyzerService(),
            new HelpdeskRiskAnalyzerService(),
            inventoryRiskAnalyzer,
            new PropertyRiskAggregationService(),
            new PropertyHealthAdvisoryService(),
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
