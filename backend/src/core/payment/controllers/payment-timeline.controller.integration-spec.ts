import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PaymentTimelineController,
} from './payment-timeline.controller';

describe(
  'PaymentTimelineController',
  () => {
    it(
      'returns payment timeline',
      async () => {
        const service = {
          timeline:
            jest.fn(
              async () => [
                {
                  id:
                    'event-1',
                },
              ],
            ),
        };

        const controller =
          new PaymentTimelineController(
            service as never,
          );

        await expect(
          controller.timeline(
            'payment-1',
          ),
        ).resolves.toEqual([
          {
            id:
              'event-1',
          },
        ]);
      },
    );
  },
);
