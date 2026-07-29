import {
  PhotonProvider,
  PhotonProviderError,
} from '../index';

describe(
  'PhotonProvider',
  () => {
    it(
      'builds forward-search requests and maps results',
      async () => {
        const fetchImplementation =
          jest.fn(
            async (
              input:
                URL |
                RequestInfo,
            ) => {
              const url =
                new URL(
                  String(input),
                );

              expect(
                url.pathname,
              ).toBe(
                '/api',
              );

              expect(
                url.searchParams.get(
                  'q',
                ),
              ).toBe(
                'hospital',
              );

              expect(
                url.searchParams.get(
                  'lat',
                ),
              ).toBe(
                '13.0827',
              );

              expect(
                url.searchParams.get(
                  'lon',
                ),
              ).toBe(
                '80.2707',
              );

              expect(
                url.searchParams.get(
                  'countrycode',
                ),
              ).toBe(
                'IN',
              );

              expect(
                url.searchParams.get(
                  'lang',
                ),
              ).toBe(
                'en',
              );

              return {
                ok:
                  true,

                status:
                  200,

                async json() {
                  return {
                    type:
                      'FeatureCollection',

                    features: [
                      {
                        type:
                          'Feature',

                        geometry: {
                          type:
                            'Point',

                          coordinates: [
                            80.2707,
                            13.0827,
                          ],
                        },

                        properties: {
                          name:
                            'Example Hospital',

                          city:
                            'Chennai',

                          country:
                            'India',

                          countrycode:
                            'IN',

                          osm_key:
                            'amenity',

                          osm_value:
                            'hospital',

                          osm_type:
                            'N',

                          osm_id:
                            123,
                        },
                      },
                    ],
                  };
                },
              } as Response;
            },
          );

        const provider =
          new PhotonProvider({
            configuration: {
              endpoint:
                'https://photon.example.test',

              userAgent:
                'PropertyOS Tests',
            },

            fetchImplementation:
              fetchImplementation as
                never,
          });

        await expect(
          provider.search({
            query:
              'hospital',

            coordinateBias: {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },

            countryCode:
              'IN',

            language:
              'en',

            limit:
              5,
          }),
        ).resolves.toMatchObject({
          providerName:
            'photon',

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
          },
        });
      },
    );

    it(
      'classifies throttling as retryable',
      async () => {
        const provider =
          new PhotonProvider({
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
          provider.search({
            query:
              'hospital',
          }),
        ).rejects.toMatchObject({
          code:
            'PHOTON_PROVIDER_UNAVAILABLE',

          retryable:
            true,
        });
      },
    );

    it(
      'rejects malformed provider responses',
      async () => {
        const provider =
          new PhotonProvider({
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
          provider.search({
            query:
              'hospital',
          }),
        ).rejects.toBeInstanceOf(
          PhotonProviderError,
        );
      },
    );
  },
);
