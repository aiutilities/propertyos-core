import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  MapsController,
} from './maps.controller';

describe(
  'MapsController',
  () => {
    it(
      'returns wrapped geocode responses',
      async () => {
        const service = {
          geocode:
            jest.fn(
              async () => ({
                providerName:
                  'nominatim',
              }),
            ),
        };

        const controller =
          new MapsController(
            service as never,
          );

        await expect(
          controller.geocode(
            {
              query:
                'Chennai',
            },
            'request-1',
            'actor-1',
          ),
        ).resolves.toEqual({
          success:
            true,

          data: {
            providerName:
              'nominatim',
          },
        });

        expect(
          service.geocode
            .mock
            .calls,
        ).toEqual([
          [
            {
              query:
                'Chennai',
            },
            {
              correlationId:
                'request-1',

              actorId:
                'actor-1',
            },
          ],
        ]);
      },
    );

    it(
      'returns Maps health',
      () => {
        const controller =
          new MapsController({
            health:
              () => ({
                enabled:
                  true,
              }),
          } as never);

        expect(
          controller.health(),
        ).toEqual({
          success:
            true,

          data: {
            enabled:
              true,
          },
        });
      },
    );
  },
);
