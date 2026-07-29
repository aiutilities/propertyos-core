import {
  OsrmProvider,
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

describe(
  'OsrmProvider',
  () => {
    it(
      'maps route geometry and steps',
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
              ).toContain(
                '/route/v1/driving/',
              );

              expect(
                url.pathname,
              ).toContain(
                '80.2707,13.0827',
              );

              expect(
                url.pathname,
              ).toContain(
                '77.5946,12.9716',
              );

              expect(
                url.searchParams.get(
                  'geometries',
                ),
              ).toBe(
                'geojson',
              );

              expect(
                url.searchParams.get(
                  'steps',
                ),
              ).toBe(
                'true',
              );

              return jsonResponse({
                code:
                  'Ok',

                routes: [
                  {
                    distance:
                      345000,

                    duration:
                      18000,

                    weight:
                      17900,

                    weight_name:
                      'routability',

                    geometry: {
                      type:
                        'LineString',

                      coordinates: [
                        [
                          80.2707,
                          13.0827,
                        ],
                        [
                          77.5946,
                          12.9716,
                        ],
                      ],
                    },

                    legs: [
                      {
                        distance:
                          345000,

                        duration:
                          18000,

                        steps: [
                          {
                            distance:
                              1000,

                            duration:
                              300,

                            name:
                              'Poonamallee High Road',

                            maneuver: {
                              location: [
                                80.2707,
                                13.0827,
                              ],

                              type:
                                'depart',

                              modifier:
                                'straight',
                            },

                            geometry: {
                              type:
                                'LineString',

                              coordinates: [
                                [
                                  80.2707,
                                  13.0827,
                                ],
                                [
                                  80.25,
                                  13.07,
                                ],
                              ],
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              });
            },
          );

        const provider =
          new OsrmProvider({
            fetchImplementation:
              fetchMock as
                unknown as
                typeof fetch,
          });

        await expect(
          provider.route({
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

            travelMode:
              'DRIVING',

            alternatives:
              true,
          }),
        ).resolves.toMatchObject({
          providerName:
            'osrm',

          routes: [
            {
              id:
                'osrm-route-1',

              distanceMeters:
                345000,

              durationSeconds:
                18000,

              geometry: [
                {
                  latitude:
                    13.0827,

                  longitude:
                    80.2707,
                },
                {
                  latitude:
                    12.9716,

                  longitude:
                    77.5946,
                },
              ],

              steps: [
                {
                  distanceMeters:
                    1000,

                  durationSeconds:
                    300,

                  instruction:
                    'depart straight onto Poonamallee High Road',
                },
              ],
            },
          ],
        });
      },
    );

    it(
      'includes intermediate waypoints',
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
              ).toContain(
                '80,13;79,12.5;78,12',
              );

              return jsonResponse({
                code:
                  'Ok',

                routes: [
                  {
                    distance:
                      1000,

                    duration:
                      100,

                    geometry: {
                      type:
                        'LineString',

                      coordinates: [
                        [
                          80,
                          13,
                        ],
                        [
                          78,
                          12,
                        ],
                      ],
                    },
                  },
                ],
              });
            },
          );

        await new OsrmProvider({
          fetchImplementation:
            fetchMock as
              unknown as
              typeof fetch,
        }).route({
          origin: {
            latitude:
              13,

            longitude:
              80,
          },

          waypoints: [
            {
              latitude:
                12.5,

              longitude:
                79,
            },
          ],

          destination: {
            latitude:
              12,

            longitude:
              78,
          },
        });
      },
    );

    it(
      'normalizes no-route responses',
      async () => {
        const provider =
          new OsrmProvider({
            fetchImplementation:
              jest.fn(
                async () =>
                  jsonResponse({
                    code:
                      'NoRoute',

                    message:
                      'Impossible route',
                  }),
              ) as unknown as
                typeof fetch,
          });

        await expect(
          provider.route({
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
        ).rejects.toMatchObject({
          code:
            'ROUTE_NOT_FOUND',

          retryable:
            false,
        });
      },
    );

    it(
      'rejects unsupported transit routing',
      async () => {
        const provider =
          new OsrmProvider({
            fetchImplementation:
              jest.fn() as
                unknown as
                typeof fetch,
          });

        await expect(
          provider.route({
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

            travelMode:
              'TRANSIT',
          }),
        ).rejects.toMatchObject({
          code:
            'TRAVEL_MODE_NOT_SUPPORTED',
        });
      },
    );

    it(
      'normalizes temporary HTTP failures',
      async () => {
        const provider =
          new OsrmProvider({
            fetchImplementation:
              jest.fn(
                async () =>
                  jsonResponse(
                    {},
                    503,
                  ),
              ) as unknown as
                typeof fetch,
          });

        await expect(
          provider.route({
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
        ).rejects.toMatchObject({
          code:
            'PROVIDER_UNAVAILABLE',

          retryable:
            true,
        });
      },
    );
  },
);
