import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  MapsService,
} from './maps.service';

describe(
  'MapsService',
  () => {
    it(
      'returns successful Maps results with cache metadata',
      async () => {
        const cachedService = {
          geocode:
            jest.fn(
              async () => ({
                result: {
                  success:
                    true,

                  providerName:
                    'nominatim',

                  result: {
                    providerName:
                      'nominatim',

                    places: [],
                  },

                  attempts: [
                    {
                      providerName:
                        'nominatim',

                      success:
                        true,
                    },
                  ],
                },

                metadata: {
                  cache:
                    'MISS',

                  cacheKey:
                    'maps-key',

                  deduplicated:
                    false,
                },
              }),
            ),
        };

        const runtime = {
          isEnabled:
            () =>
              true,

          getService:
            () =>
              cachedService,
        };

        const service =
          new MapsService(
            runtime as never,
          );

        await expect(
          service.geocode({
            query:
              'Chennai',
          }),
        ).resolves.toMatchObject({
          providerName:
            'nominatim',

          result: {
            places: [],
          },

          cache: {
            cache:
              'MISS',
          },
        });
      },
    );

    it(
      'fails closed when Maps is disabled',
      async () => {
        const service =
          new MapsService({
            isEnabled:
              () =>
                false,
          } as never);

        await expect(
          service.geocode({
            query:
              'Chennai',
          }),
        ).rejects.toBeInstanceOf(
          ServiceUnavailableException,
        );
      },
    );

    it(
      'maps retryable failures to service unavailable',
      async () => {
        const service =
          new MapsService({
            isEnabled:
              () =>
                true,

            getService:
              () => ({
                geocode:
                  async () => ({
                    result: {
                      success:
                        false,

                      errorCode:
                        'PROVIDER_UNAVAILABLE',

                      errorMessage:
                        'Provider unavailable',

                      retryable:
                        true,

                      attempts: [],
                    },

                    metadata: {
                      cache:
                        'MISS',
                    },
                  }),
              }),
          } as never);

        await expect(
          service.geocode({
            query:
              'Chennai',
          }),
        ).rejects.toBeInstanceOf(
          ServiceUnavailableException,
        );
      },
    );

    it(
      'maps permanent failures to bad requests',
      async () => {
        const service =
          new MapsService({
            isEnabled:
              () =>
                true,

            getService:
              () => ({
                route:
                  async () => ({
                    result: {
                      success:
                        false,

                      errorCode:
                        'ROUTE_NOT_FOUND',

                      errorMessage:
                        'No route found',

                      retryable:
                        false,

                      attempts: [],
                    },

                    metadata: {
                      cache:
                        'MISS',
                    },
                  }),
              }),
          } as never);

        await expect(
          service.route({
            origin: {
              latitude:
                13,

              longitude:
                80,
            },

            destination: {
              latitude:
                12,

              longitude:
                77,
            },
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );
  },
);
