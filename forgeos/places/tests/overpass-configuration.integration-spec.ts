import {
  resolveOverpassConfiguration,
} from '../index';

describe(
  'Overpass configuration',
  () => {
    it(
      'uses safe defaults',
      () => {
        expect(
          resolveOverpassConfiguration(),
        ).toMatchObject({
          status:
            'READY',

          endpoint:
            'https://overpass-api.de/api/interpreter',

          timeoutMilliseconds:
            20000,

          queryTimeoutSeconds:
            15,
        });
      },
    );

    it(
      'blocks invalid configuration',
      () => {
        const configuration =
          resolveOverpassConfiguration({
            endpoint:
              'invalid',

            timeoutMilliseconds:
              0,

            queryTimeoutSeconds:
              181,
          });

        expect(
          configuration.status,
        ).toBe(
          'BLOCKED',
        );

        expect(
          configuration.errors,
        ).toHaveLength(3);
      },
    );
  },
);
