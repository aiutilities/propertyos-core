import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyRiskSignal,
} from '../types/property-risk-signal.types';


describe(
  'PropertyRiskSignal',
  () => {


    it(
      'creates maintenance risk signal',
      () => {

        const signal:
          PropertyRiskSignal =
        {

          category:
            'MAINTENANCE',

          severity:
            'HIGH',

          message:
            'Maintenance SLA breach detected',

          source:
            'maintenance',
        };


        expect(signal)
          .toEqual(
            expect.objectContaining({

              category:
                'MAINTENANCE',

              severity:
                'HIGH',
            }),
          );
      },
    );


  },
);
