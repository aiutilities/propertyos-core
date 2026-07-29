import {
  resolvePhotonConfiguration,
} from '../index';

describe(
  'Photon configuration',
  () => {
    it(
      'uses safe defaults',
      () => {
        expect(
          resolvePhotonConfiguration(),
        ).toMatchObject({
          status:
            'READY',

          endpoint:
            'https://photon.komoot.io',

          timeoutMilliseconds:
            10000,
        });
      },
    );

    it(
      'blocks invalid endpoints and timeouts',
      () => {
        const configuration =
          resolvePhotonConfiguration({
            endpoint:
              'not-a-url',

            timeoutMilliseconds:
              0,
          });

        expect(
          configuration.status,
        ).toBe(
          'BLOCKED',
        );

        expect(
          configuration.errors,
        ).toHaveLength(2);
      },
    );
  },
);
