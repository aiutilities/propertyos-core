import {
  WikidataProvider,
  WikidataProviderError,
} from '../index';

describe(
  'WikidataProvider',
  () => {
    it(
      'retrieves and maps entity details',
      async () => {
        const fetchImplementation =
          jest.fn(
            async (
              input:
                URL |
                RequestInfo,
            ) => {
              expect(
                String(input),
              ).toBe(
                'https://wikidata.example.test/entity/Q123.json',
              );

              return {
                ok:
                  true,

                status:
                  200,

                async json() {
                  return {
                    entities: {
                      Q123: {
                        id:
                          'Q123',

                        labels: {
                          en: {
                            language:
                              'en',

                            value:
                              'Example Landmark',
                          },
                        },

                        claims: {
                          P625: [
                            {
                              mainsnak: {
                                snaktype:
                                  'value',

                                property:
                                  'P625',

                                datavalue: {
                                  type:
                                    'globecoordinate',

                                  value: {
                                    latitude:
                                      13,

                                    longitude:
                                      80,
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  };
                },
              } as Response;
            },
          );

        const provider =
          new WikidataProvider({
            configuration: {
              endpoint:
                'https://wikidata.example.test/entity',

              userAgent:
                'PropertyOS Tests',
            },

            fetchImplementation:
              fetchImplementation as
                never,
          });

        await expect(
          provider.details({
            placeId:
              'q123',

            language:
              'en',
          }),
        ).resolves.toMatchObject({
          providerName:
            'wikidata',

          place: {
            id:
              'Q123',

            name:
              'Example Landmark',
          },

          metadata: {
            found:
              true,
          },
        });
      },
    );

    it(
      'rejects invalid entity identifiers',
      async () => {
        const provider =
          new WikidataProvider({
            fetchImplementation:
              jest.fn() as never,
          });

        await expect(
          provider.details({
            placeId:
              'invalid',
          }),
        ).rejects.toMatchObject({
          code:
            'WIKIDATA_ENTITY_ID_INVALID',

          retryable:
            false,
        });
      },
    );

    it(
      'classifies throttling as retryable',
      async () => {
        const provider =
          new WikidataProvider({
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
          provider.details({
            placeId:
              'Q123',
          }),
        ).rejects.toMatchObject({
          code:
            'WIKIDATA_PROVIDER_UNAVAILABLE',

          retryable:
            true,
        });
      },
    );

    it(
      'rejects malformed responses',
      async () => {
        const provider =
          new WikidataProvider({
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
          provider.details({
            placeId:
              'Q123',
          }),
        ).rejects.toBeInstanceOf(
          WikidataProviderError,
        );
      },
    );
  },
);
