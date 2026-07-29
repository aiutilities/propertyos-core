import {
  InMemoryMapsProviderHealthStore,
  MapsDispatcher,
  MapsFallbackEngine,
  MapsProviderRegistry,
  MapsProviderSelection,
} from '../index';

function createFixture(
  primaryFailure: {
    errorCode:
      string;

    retryable:
      boolean;
  },
) {
  const registry =
    new MapsProviderRegistry();

  const primary =
    jest.fn(
      async () => {
        throw {
          code:
            primaryFailure
              .errorCode,

          message:
            'Primary failed',

          retryable:
            primaryFailure
              .retryable,
        };
      },
    );

  const fallback =
    jest.fn(
      async () => ({
        providerName:
          'fallback',

        places: [
          {
            id:
              'place-1',

            providerName:
              'fallback',

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
      'primary',

    capabilities: [
      'GEOCODING',
    ],

    geocode:
      primary,
  });

  registry.register({
    name:
      'fallback',

    capabilities: [
      'GEOCODING',
    ],

    geocode:
      fallback,
  });

  const selection =
    new MapsProviderSelection(
      {
        rules: [
          {
            capability:
              'GEOCODING',

            providers: [
              'primary',
              'fallback',
            ],
          },
        ],
      },

      registry,
    );

  const healthStore =
    new InMemoryMapsProviderHealthStore();

  return {
    primary,
    fallback,
    healthStore,

    subject:
      new MapsFallbackEngine({
        dispatcher:
          new MapsDispatcher({
            registry,
          }),

        selection,
        healthStore,

        now:
          () =>
            '2026-07-29T16:00:00.000Z',
      }),
  };
}

describe(
  'MapsFallbackEngine',
  () => {
    it(
      'falls back after a retryable provider failure',
      async () => {
        const fixture =
          createFixture({
            errorCode:
              'PROVIDER_UNAVAILABLE',

            retryable:
              true,
          });

        await expect(
          fixture.subject
            .geocode({
              query:
                'Chennai',
            }),
        ).resolves.toMatchObject({
          success:
            true,

          providerName:
            'fallback',

          attempts: [
            {
              providerName:
                'primary',

              success:
                false,

              retryable:
                true,
            },
            {
              providerName:
                'fallback',

              success:
                true,
            },
          ],
        });

        expect(
          fixture.primary,
        ).toHaveBeenCalledTimes(1);

        expect(
          fixture.fallback,
        ).toHaveBeenCalledTimes(1);

        expect(
          fixture.healthStore
            .get(
              'primary',
            ),
        ).toMatchObject({
          healthy:
            false,

          consecutiveFailures:
            1,

          lastErrorCode:
            'PROVIDER_UNAVAILABLE',
        });

        expect(
          fixture.healthStore
            .get(
              'fallback',
            ),
        ).toMatchObject({
          healthy:
            true,

          consecutiveFailures:
            0,
        });
      },
    );

    it(
      'does not fall back after a permanent provider rejection',
      async () => {
        const fixture =
          createFixture({
            errorCode:
              'REQUEST_REJECTED',

            retryable:
              false,
          });

        await expect(
          fixture.subject
            .geocode({
              query:
                'Chennai',
            }),
        ).resolves.toMatchObject({
          success:
            false,

          errorCode:
            'REQUEST_REJECTED',

          retryable:
            false,

          attempts: [
            {
              providerName:
                'primary',

              success:
                false,
            },
          ],
        });

        expect(
          fixture.fallback,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns the final failure after all retryable providers fail',
      async () => {
        const registry =
          new MapsProviderRegistry();

        for (
          const providerName of
            [
              'one',
              'two',
            ]
        ) {
          registry.register({
            name:
              providerName,

            capabilities: [
              'GEOCODING',
            ],

            async geocode() {
              throw {
                code:
                  `${providerName.toUpperCase()}_FAILED`,

                message:
                  `${providerName} failed`,

                retryable:
                  true,
              };
            },
          });
        }

        const subject =
          new MapsFallbackEngine({
            dispatcher:
              new MapsDispatcher({
                registry,
              }),

            selection:
              new MapsProviderSelection(
                {
                  rules: [
                    {
                      capability:
                        'GEOCODING',

                      providers: [
                        'one',
                        'two',
                      ],
                    },
                  ],
                },

                registry,
              ),
          });

        await expect(
          subject.geocode({
            query:
              'Chennai',
          }),
        ).resolves.toMatchObject({
          success:
            false,

          errorCode:
            'TWO_FAILED',

          retryable:
            true,

          attempts: [
            {
              providerName:
                'one',
            },
            {
              providerName:
                'two',
            },
          ],
        });
      },
    );

    it(
      'tracks consecutive health failures and recovery',
      () => {
        const health =
          new InMemoryMapsProviderHealthStore();

        health.recordFailure(
          'provider',
          'FAILED',
          '2026-07-29T10:00:00.000Z',
        );

        health.recordFailure(
          'provider',
          'FAILED_AGAIN',
          '2026-07-29T10:01:00.000Z',
        );

        expect(
          health.get(
            'provider',
          ),
        ).toMatchObject({
          healthy:
            false,

          consecutiveFailures:
            2,

          lastErrorCode:
            'FAILED_AGAIN',
        });

        health.recordSuccess(
          'provider',
          '2026-07-29T10:02:00.000Z',
        );

        expect(
          health.get(
            'provider',
          ),
        ).toMatchObject({
          healthy:
            true,

          consecutiveFailures:
            0,

          lastSuccessAt:
            '2026-07-29T10:02:00.000Z',
        });
      },
    );
  },
);
