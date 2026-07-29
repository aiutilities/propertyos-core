import {
  NominatimProvider,
} from '../index';

function jsonResponse(
  body:
    unknown,

  status =
    200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        'content-type':
          'application/json',
      },
    },
  );
}

function provider(
  fetchImplementation:
    typeof fetch,

  overrides: {
    now?:
      () => number;

    sleep?:
      (
        milliseconds:
          number,
      ) => Promise<void>;
  } = {},
) {
  return new NominatimProvider({
    configuration: {
      userAgent:
        'PropertyOS/1.0 maps@example.com',

      email:
        'maps@example.com',

      timeoutMilliseconds:
        100,
    },

    fetchImplementation,

    now:
      overrides.now,

    sleep:
      overrides.sleep,
  });
}

describe(
  'NominatimProvider',
  () => {
    it(
      'maps geocoding responses into ForgeOS places',
      async () => {
        const fetchMock =
          jest.fn(
            async (
              input:
                URL |
                RequestInfo,
              init?:
                RequestInit,
            ) => {
              const url =
                new URL(
                  String(input),
                );

              expect(
                url.pathname,
              ).toBe(
                '/search',
              );

              expect(
                url.searchParams.get(
                  'q',
                ),
              ).toBe(
                'Chennai Central',
              );

              expect(
                url.searchParams.get(
                  'countrycodes',
                ),
              ).toBe(
                'in',
              );

              expect(
                (
                  init
                    ?.headers as
                    Record<
                      string,
                      string
                    >
                )[
                  'User-Agent'
                ],
              ).toContain(
                'PropertyOS',
              );

              return jsonResponse([
                {
                  place_id:
                    123,

                  osm_type:
                    'node',

                  osm_id:
                    456,

                  lat:
                    '13.0827',

                  lon:
                    '80.2707',

                  display_name:
                    'Chennai Central, Tamil Nadu, India',

                  name:
                    'Chennai Central',

                  category:
                    'railway',

                  type:
                    'station',

                  importance:
                    0.9,

                  address: {
                    city:
                      'Chennai',

                    state:
                      'Tamil Nadu',

                    postcode:
                      '600003',

                    country:
                      'India',

                    country_code:
                      'in',
                  },
                },
              ]);
            },
          );

        await expect(
          provider(
            fetchMock as
              unknown as
              typeof fetch,
          ).geocode({
            query:
              'Chennai Central',

            countryCode:
              'IN',

            limit:
              5,
          }),
        ).resolves.toMatchObject({
          providerName:
            'nominatim',

          places: [
            {
              id:
                '123',

              name:
                'Chennai Central',

              coordinate: {
                latitude:
                  13.0827,

                longitude:
                  80.2707,
              },

              address: {
                city:
                  'Chennai',

                state:
                  'Tamil Nadu',

                countryCode:
                  'IN',
              },

              categories: [
                'railway',
                'station',
              ],
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
      'maps a reverse-geocoding response',
      async () => {
        const fetchMock =
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
                '/reverse',
              );

              expect(
                url.searchParams.get(
                  'lat',
                ),
              ).toBe(
                '13.0827',
              );

              return jsonResponse({
                place_id:
                  999,

                lat:
                  '13.0827',

                lon:
                  '80.2707',

                display_name:
                  'Chennai, Tamil Nadu, India',

                address: {
                  city:
                    'Chennai',

                  state:
                    'Tamil Nadu',

                  country:
                    'India',

                  country_code:
                    'in',
                },
              });
            },
          );

        await expect(
          provider(
            fetchMock as
              unknown as
              typeof fetch,
          ).reverseGeocode({
            coordinate: {
              latitude:
                13.0827,

              longitude:
                80.2707,
            },
          }),
        ).resolves.toMatchObject({
          places: [
            {
              id:
                '999',

              address: {
                city:
                  'Chennai',
              },
            },
          ],
        });
      },
    );

    it(
      'normalizes rate limiting',
      async () => {
        const fetchMock =
          jest.fn(
            async () =>
              jsonResponse(
                {
                  error:
                    'Too many requests',
                },
                429,
              ),
          );

        await expect(
          provider(
            fetchMock as
              unknown as
              typeof fetch,
          ).geocode({
            query:
              'Chennai',
          }),
        ).rejects.toMatchObject({
          code:
            'PROVIDER_RATE_LIMITED',

          retryable:
            true,
        });
      },
    );

    it(
      'enforces the configured request interval',
      async () => {
        let now =
          10_000;

        const sleep =
          jest.fn(
            async (
              milliseconds:
                number,
            ) => {
              now +=
                milliseconds;
            },
          );

        const fetchMock =
          jest.fn(
            async () =>
              jsonResponse([]),
          );

        const subject =
          provider(
            fetchMock as
              unknown as
              typeof fetch,
            {
              now:
                () =>
                  now,

              sleep,
            },
          );

        await subject.geocode({
          query:
            'Chennai',
        });

        now +=
          250;

        await subject.geocode({
          query:
            'Madurai',
        });

        expect(
          sleep,
        ).toHaveBeenCalledWith(
          750,
        );
      },
    );

    it(
      'fails closed for invalid configuration',
      () => {
        expect(
          () =>
            new NominatimProvider({
              configuration: {
                userAgent:
                  '',
              },
            }),
        ).toThrow(
          'NOMINATIM_CONFIGURATION_BLOCKED',
        );
      },
    );
  },
);
