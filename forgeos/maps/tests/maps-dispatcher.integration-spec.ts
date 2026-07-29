import {
  MapsDispatcher,
  MapsProviderCapabilityNotSupportedError,
  MapsProviderRegistry,
  MapsRequestValidationError,
} from '../index';

function fixture() {
  const registry =
    new MapsProviderRegistry();

  const geocode =
    jest.fn(
      async () => ({
        providerName:
          'test-maps',
        places: [
          {
            id:
              'place-1',
            providerName:
              'test-maps',
            coordinate: {
              latitude:
                13.0827,
              longitude:
                80.2707,
            },
            address: {
              formattedAddress:
                'Chennai, Tamil Nadu, India',
            },
          },
        ],
      }),
    );

  const reverseGeocode =
    jest.fn(
      async () => ({
        providerName:
          'test-maps',
        places: [],
      }),
    );

  const route =
    jest.fn(
      async () => ({
        providerName:
          'test-maps',
        routes: [
          {
            id:
              'route-1',
            providerName:
              'test-maps',
            distanceMeters:
              1000,
            durationSeconds:
              300,
            geometry: [],
          },
        ],
      }),
    );

  const nearbySearch =
    jest.fn(
      async () => ({
        providerName:
          'test-maps',
        places: [],
      }),
    );

  registry.register({
    name:
      'test-maps',

    capabilities: [
      'GEOCODING',
      'REVERSE_GEOCODING',
      'ROUTING',
      'NEARBY_SEARCH',
    ],

    geocode,
    reverseGeocode,
    route,
    nearbySearch,
  });

  return {
    registry,
    dispatcher:
      new MapsDispatcher({
        registry,
      }),
    geocode,
    reverseGeocode,
    route,
    nearbySearch,
  };
}

describe(
  'MapsDispatcher',
  () => {
    it(
      'dispatches geocoding through the selected provider',
      async () => {
        const subject =
          fixture();

        await expect(
          subject.dispatcher
            .geocode({
              providerName:
                'test-maps',

              request: {
                query:
                  'Chennai',
              },
            }),
        ).resolves.toMatchObject({
          success:
            true,

          providerName:
            'test-maps',

          result: {
            places: [
              {
                id:
                  'place-1',
              },
            ],
          },
        });

        expect(
          subject.geocode,
        ).toHaveBeenCalledWith({
          query:
            'Chennai',
        });
      },
    );

    it(
      'dispatches reverse geocoding, routing, and nearby search',
      async () => {
        const subject =
          fixture();

        await subject.dispatcher
          .reverseGeocode({
            providerName:
              'test-maps',
            request: {
              coordinate: {
                latitude:
                  13.0827,
                longitude:
                  80.2707,
              },
            },
          });

        await subject.dispatcher
          .route({
            providerName:
              'test-maps',
            request: {
              origin: {
                latitude:
                  13.0827,
                longitude:
                  80.2707,
              },
              destination: {
                latitude:
                  12.9716,
                longitude:
                  77.5946,
              },
            },
          });

        await subject.dispatcher
          .nearbySearch({
            providerName:
              'test-maps',
            request: {
              center: {
                latitude:
                  13.0827,
                longitude:
                  80.2707,
              },
              radiusMeters:
                5000,
            },
          });

        expect(
          subject.reverseGeocode,
        ).toHaveBeenCalledTimes(1);

        expect(
          subject.route,
        ).toHaveBeenCalledTimes(1);

        expect(
          subject.nearbySearch,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'fails before provider execution for an invalid request',
      async () => {
        const subject =
          fixture();

        await expect(
          subject.dispatcher
            .geocode({
              providerName:
                'test-maps',
              request: {
                query:
                  '',
              },
            }),
        ).rejects.toBeInstanceOf(
          MapsRequestValidationError,
        );

        expect(
          subject.geocode,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an unsupported provider capability',
      async () => {
        const registry =
          new MapsProviderRegistry();

        registry.register({
          name:
            'geocoder-only',
          capabilities: [
            'GEOCODING',
          ],
          geocode:
            async () => ({
              providerName:
                'geocoder-only',
              places: [],
            }),
        });

        const dispatcher =
          new MapsDispatcher({
            registry,
          });

        await expect(
          dispatcher.route({
            providerName:
              'geocoder-only',
            request: {
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
            },
          }),
        ).rejects.toBeInstanceOf(
          MapsProviderCapabilityNotSupportedError,
        );
      },
    );

    it(
      'normalizes provider failures',
      async () => {
        const registry =
          new MapsProviderRegistry();

        registry.register({
          name:
            'failing-provider',

          capabilities: [
            'GEOCODING',
          ],

          async geocode() {
            throw {
              code:
                'PROVIDER_RATE_LIMITED',

              message:
                'Rate limit reached',

              retryable:
                true,
            };
          },
        });

        const dispatcher =
          new MapsDispatcher({
            registry,
          });

        await expect(
          dispatcher.geocode({
            providerName:
              'failing-provider',

            request: {
              query:
                'Chennai',
            },
          }),
        ).resolves.toEqual({
          success:
            false,

          providerName:
            'failing-provider',

          errorCode:
            'PROVIDER_RATE_LIMITED',

          errorMessage:
            'Rate limit reached',

          retryable:
            true,
        });
      },
    );
  },
);
