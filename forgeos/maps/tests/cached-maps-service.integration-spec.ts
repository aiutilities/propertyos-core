import {
  CachedMapsService,
  InMemoryMapsCacheStore,
  MapsDispatcher,
  MapsFallbackEngine,
  MapsProviderRegistry,
  MapsProviderSelection,
} from '../index';

function createFixture() {
  const registry =
    new MapsProviderRegistry();

  const geocode =
    jest.fn(
      async () => ({
        providerName:
          'nominatim',

        places: [
          {
            id:
              'place-1',

            providerName:
              'nominatim',

            coordinate: {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },

            address: {
              formattedAddress:
                'Chennai',
            },
          },
        ],
      }),
    );

  registry.register({
    name:
      'nominatim',

    capabilities: [
      'GEOCODING',
    ],

    geocode,
  });

  const selection =
    new MapsProviderSelection(
      {
        rules: [
          {
            capability:
              'GEOCODING',

            providers: [
              'nominatim',
            ],
          },
        ],
      },

      registry,
    );

  let now =
    1000;

  const cache =
    new InMemoryMapsCacheStore();

  const service =
    new CachedMapsService({
      engine:
        new MapsFallbackEngine({
          dispatcher:
            new MapsDispatcher({
              registry,
            }),

          selection,
        }),

      selection,
      cache,

      policy: {
        ttlMilliseconds: {
          GEOCODE:
            1000,
        },
      },

      now:
        () =>
          now,
    });

  return {
    service,
    cache,
    geocode,

    advance(
      milliseconds:
        number,
    ) {
      now +=
        milliseconds;
    },
  };
}

describe(
  'CachedMapsService',
  () => {
    it(
      'returns a cached successful geocode result',
      async () => {
        const fixture =
          createFixture();

        const first =
          await fixture.service
            .geocode({
              query:
                'Chennai',
            });

        const second =
          await fixture.service
            .geocode({
              query:
                'Chennai',
            });

        expect(
          first.metadata.cache,
        ).toBe(
          'MISS',
        );

        expect(
          second.metadata.cache,
        ).toBe(
          'HIT',
        );

        expect(
          fixture.geocode,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'refreshes after TTL expiry',
      async () => {
        const fixture =
          createFixture();

        await fixture.service
          .geocode({
            query:
              'Chennai',
          });

        fixture.advance(
          1001,
        );

        await fixture.service
          .geocode({
            query:
              'Chennai',
          });

        expect(
          fixture.geocode,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it(
      'deduplicates concurrent requests',
      async () => {
        const registry =
          new MapsProviderRegistry();

        let resolveProvider:
          (
            value:
              unknown,
          ) => void =
            () =>
              undefined;

        const geocode =
          jest.fn(
            () =>
              new Promise(
                (resolve) => {
                  resolveProvider =
                    resolve;
                },
              ),
          );

        registry.register({
          name:
            'nominatim',

          capabilities: [
            'GEOCODING',
          ],

          geocode:
            geocode as never,
        });

        const selection =
          new MapsProviderSelection(
            {
              rules: [
                {
                  capability:
                    'GEOCODING',

                  providers: [
                    'nominatim',
                  ],
                },
              ],
            },

            registry,
          );

        const service =
          new CachedMapsService({
            engine:
              new MapsFallbackEngine({
                dispatcher:
                  new MapsDispatcher({
                    registry,
                  }),

                selection,
              }),

            selection,

            cache:
              new InMemoryMapsCacheStore(),
          });

        const first =
          service.geocode({
            query:
              'Chennai',
          });

        const second =
          service.geocode({
            query:
              'Chennai',
          });

        resolveProvider({
          providerName:
            'nominatim',

          places: [],
        });

        const [
          firstResult,
          secondResult,
        ] =
          await Promise.all([
            first,
            second,
          ]);

        expect(
          geocode,
        ).toHaveBeenCalledTimes(1);

        expect(
          firstResult
            .metadata
            .deduplicated,
        ).toBe(false);

        expect(
          secondResult
            .metadata
            .deduplicated,
        ).toBe(true);
      },
    );

    it(
      'does not cache failures by default',
      async () => {
        const registry =
          new MapsProviderRegistry();

        const geocode =
          jest.fn(
            async () => {
              throw {
                code:
                  'PROVIDER_UNAVAILABLE',

                message:
                  'Unavailable',

                retryable:
                  true,
              };
            },
          );

        registry.register({
          name:
            'nominatim',

          capabilities: [
            'GEOCODING',
          ],

          geocode,
        });

        const selection =
          new MapsProviderSelection(
            {
              rules: [
                {
                  capability:
                    'GEOCODING',

                  providers: [
                    'nominatim',
                  ],
                },
              ],
            },

            registry,
          );

        const service =
          new CachedMapsService({
            engine:
              new MapsFallbackEngine({
                dispatcher:
                  new MapsDispatcher({
                    registry,
                  }),

                selection,
              }),

            selection,

            cache:
              new InMemoryMapsCacheStore(),
          });

        await service.geocode({
          query:
            'Chennai',
        });

        await service.geocode({
          query:
            'Chennai',
        });

        expect(
          geocode,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it(
      'supports explicit cache invalidation',
      async () => {
        const fixture =
          createFixture();

        const first =
          await fixture.service
            .geocode({
              query:
                'Chennai',
            });

        expect(
          fixture.service
            .invalidate(
              first.metadata
                .cacheKey,
            ),
        ).toBe(true);

        await fixture.service
          .geocode({
            query:
              'Chennai',
          });

        expect(
          fixture.geocode,
        ).toHaveBeenCalledTimes(2);
      },
    );
  },
);
