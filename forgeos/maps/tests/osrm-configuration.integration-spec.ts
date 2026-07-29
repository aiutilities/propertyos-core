import {
  resolveOsrmConfiguration,
} from '../index';

describe(
  'OSRM configuration',
  () => {
    it(
      'provides safe defaults',
      () => {
        expect(
          resolveOsrmConfiguration(
            {},
          ),
        ).toMatchObject({
          status:
            'READY',

          endpoint:
            'https://router.project-osrm.org',

          timeoutMilliseconds:
            10000,

          profiles: {
            DRIVING:
              'driving',

            WALKING:
              'walking',

            CYCLING:
              'cycling',
          },
        });
      },
    );

    it(
      'allows custom endpoints and profiles',
      () => {
        expect(
          resolveOsrmConfiguration({
            endpoint:
              'https://routing.internal.example',

            profiles: {
              DRIVING:
                'car',

              WALKING:
                'foot',
            },
          }),
        ).toMatchObject({
          status:
            'READY',

          endpoint:
            'https://routing.internal.example',

          profiles: {
            DRIVING:
              'car',

            WALKING:
              'foot',
          },
        });
      },
    );

    it(
      'rejects invalid endpoint and timeout',
      () => {
        const result =
          resolveOsrmConfiguration({
            endpoint:
              'not-a-url',

            timeoutMilliseconds:
              0,
          });

        expect(
          result.status,
        ).toBe(
          'BLOCKED',
        );

        expect(
          result.errors,
        ).toHaveLength(2);
      },
    );
  },
);
