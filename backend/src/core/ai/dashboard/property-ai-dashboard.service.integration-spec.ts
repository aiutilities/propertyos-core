import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyAiDashboardService,
} from './property-ai-dashboard.service';


describe(
  'PropertyAiDashboardService',
  () => {


    it(
      'creates property AI dashboard view',
      () => {


        const service =
          new PropertyAiDashboardService();


        const result =
          service.getDashboard(
            'property-001',
          );


        expect(result.propertyId)
          .toBe(
            'property-001',
          );


        expect(result.healthStatus)
          .toBeDefined();


      },
    );


  },
);
