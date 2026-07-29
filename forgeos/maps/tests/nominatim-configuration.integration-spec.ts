import {
  resolveNominatimConfiguration,
} from '../index';

describe(
  'Nominatim configuration',
  () => {
    it(
      'requires an application-identifying user agent',
      () => {
        expect(
          resolveNominatimConfiguration({
            userAgent:
              '',
          }).status,
        ).toBe(
          'BLOCKED',
        );
      },
    );

    it(
      'defaults to the public endpoint and one-second interval',
      () => {
        expect(
          resolveNominatimConfiguration({
            userAgent:
              'PropertyOS/1.0 contact@example.com',
          }),
        ).toMatchObject({
          status:
            'READY',

          endpoint:
            'https://nominatim.openstreetmap.org',

          timeoutMilliseconds:
            10000,

          minimumRequestIntervalMilliseconds:
            1000,
        });
      },
    );

    it(
      'rejects public endpoint intervals below one second',
      () => {
        const result =
          resolveNominatimConfiguration({
            userAgent:
              'PropertyOS/1.0 contact@example.com',

            minimumRequestIntervalMilliseconds:
              500,
          });

        expect(
          result.status,
        ).toBe(
          'BLOCKED',
        );

        expect(
          result
            .minimumRequestIntervalMilliseconds,
        ).toBe(
          1000,
        );
      },
    );

    it(
      'permits a custom endpoint with a custom interval',
      () => {
        expect(
          resolveNominatimConfiguration({
            endpoint:
              'https://maps.internal.example',

            userAgent:
              'PropertyOS/1.0',

            minimumRequestIntervalMilliseconds:
              50,
          }),
        ).toMatchObject({
          status:
            'READY',

          minimumRequestIntervalMilliseconds:
            50,
        });
      },
    );
  },
);
