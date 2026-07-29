import {
  OverpassProvider,
  OverpassProviderError,
} from '../index';

describe(
  'OverpassProvider',
  () => {
    it(
      'builds nearby category queries and maps results',
      async () => {
        const fetchImplementation =
          jest.fn(
            async (
              input,
              init,
            ) => {
              expect(
                String(input),
              ).toBe(
                'https://overpass.example.test/api/interpreter',
              );

              expect(
                init?.method,
              ).toBe(
                'POST',
              );

              const form =
                new URLSearchParams(
                  String(
                    init?.body,
                  ),
                );

              const query =
                form.get(
                  'data',
                ) ??
                '';

              expect(query)
                .toContain(
                  'nwr(around:5000,13.0827,80.2707)["amenity"="hospital"];',
                );

              expect(query)
                .toContain(
                  'out center tags;',
                );

              return {
                ok:
                  true,

                status:
                  200,

                async json() {
                  return {
                    version:
                      0.6,

                    osm3s: {
                      timestamp_osm_base:
                        '2026-07-30T00:00:00Z',
                    },

                    elements: [
                      {
                        type:
                          'node',

                        id:
                          123,

                        lat:
                          13.083,

                        lon:
                          80.271,

                        tags: {
                          name:
                            'Example Hospital',

                          amenity:
                            'hospital',
                        },
                      },
                    ],
                  };
                },
              } as Response;
            },
          );

        const provider =
          new OverpassProvider({
            configuration: {
              endpoint:
                'https://overpass.example.test/api/interpreter',

              userAgent:
                'PropertyOS Tests',
            },

            fetchImplementation:
              fetchImplementation as never,
          });

        await expect(
          provider.nearby({
            coordinate: {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },

            radiusMeters:
              5000,

            categories: [
              'HOSPITAL',
            ],

            limit:
              10,
          }),
        ).resolves.toMatchObject({
          providerName:
            'overpass',

          places: [
            {
              name:
                'Example Hospital',

              primaryCategory:
                'HOSPITAL',
            },
          ],

          metadata: {
            attribution:
              '© OpenStreetMap contributors',

            provider:
              'Overpass API',
          },
        });
      },
    );

    it(
      'filters nearby results by keyword',
      async () => {
        const provider =
          new OverpassProvider({
            fetchImplementation:
              async () =>
                ({
                  ok:
                    true,

                  status:
                    200,

                  async json() {
                    return {
                      elements: [
                        {
                          type:
                            'node',

                          id:
                            1,

                          lat:
                            13,

                          lon:
                            80,

                          tags: {
                            name:
                              'Alpha Hospital',

                            amenity:
                              'hospital',
                          },
                        },
                        {
                          type:
                            'node',

                          id:
                            2,

                          lat:
                            13.001,

                          lon:
                            80.001,

                          tags: {
                            name:
                              'Beta Hospital',

                            amenity:
                              'hospital',
                          },
                        },
                      ],
                    };
                  },
                }) as Response,
          });

        const result =
          await provider.nearby({
            coordinate: {
              latitude:
                13,

              longitude:
                80,
            },

            radiusMeters:
              1000,

            keyword:
              'beta',
          });

        expect(
          result.places,
        ).toHaveLength(1);

        expect(
          result.places[0]
            .name,
        ).toBe(
          'Beta Hospital',
        );
      },
    );

    it(
      'sorts results by distance and applies limit',
      async () => {
        const provider =
          new OverpassProvider({
            fetchImplementation:
              async () =>
                ({
                  ok:
                    true,

                  status:
                    200,

                  async json() {
                    return {
                      elements: [
                        {
                          type:
                            'node',

                          id:
                            2,

                          lat:
                            13.02,

                          lon:
                            80,

                          tags: {
                            name:
                              'Far Hospital',

                            amenity:
                              'hospital',
                          },
                        },
                        {
                          type:
                            'node',

                          id:
                            1,

                          lat:
                            13.001,

                          lon:
                            80,

                          tags: {
                            name:
                              'Near Hospital',

                            amenity:
                              'hospital',
                          },
                        },
                      ],
                    };
                  },
                }) as Response,
          });

        const result =
          await provider.nearby({
            coordinate: {
              latitude:
                13,

              longitude:
                80,
            },

            radiusMeters:
              5000,

            limit:
              1,
          });

        expect(
          result.places,
        ).toHaveLength(1);

        expect(
          result.places[0]
            .name,
        ).toBe(
          'Near Hospital',
        );
      },
    );

    it(
      'classifies throttling as retryable',
      async () => {
        const provider =
          new OverpassProvider({
            fetchImplementation:
              async () =>
                ({
                  ok:
                    false,

                  status:
                    429,
                }) as Response,
          });

        await expect(
          provider.nearby({
            coordinate: {
              latitude:
                13,

              longitude:
                80,
            },

            radiusMeters:
              1000,
          }),
        ).rejects.toMatchObject({
          code:
            'OVERPASS_PROVIDER_UNAVAILABLE',

          retryable:
            true,
        });
      },
    );

    it(
      'rejects malformed responses',
      async () => {
        const provider =
          new OverpassProvider({
            fetchImplementation:
              async () =>
                ({
                  ok:
                    true,

                  status:
                    200,

                  async json() {
                    return {
                      invalid:
                        true,
                    };
                  },
                }) as Response,
          });

        await expect(
          provider.nearby({
            coordinate: {
              latitude:
                13,

              longitude:
                80,
            },

            radiusMeters:
              1000,
          }),
        ).rejects.toBeInstanceOf(
          OverpassProviderError,
        );
      },
    );
  },
);
