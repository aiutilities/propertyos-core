import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PropertyAiDashboardController,
} from './property-ai-dashboard.controller';


describe(
  'PropertyAiDashboardController',
  () => {


    it(
      'returns property AI dashboard',
      () => {


        const getDashboard =
          jest.fn(
            (
              propertyId: string,
            ) => ({
              propertyId,
            }),
          );


        const controller =
          new PropertyAiDashboardController(
            {
              getDashboard,
            } as never,
          );


        const result =
          (
            controller.getDashboard as
            (
              propertyId: string,
            ) => {
              propertyId: string;
            }
          )(
            'property-001',
          );


        expect(result.propertyId)
          .toBe(
            'property-001',
          );


        expect(getDashboard)
          .toHaveBeenCalledWith(
            'property-001',
          );

      },
    );


  },
);
