import {
  resolveWikidataConfiguration,
} from '../index';

describe(
  'Wikidata configuration',
  () => {
    it(
      'uses safe defaults',
      () => {
        expect(
          resolveWikidataConfiguration(),
        ).toMatchObject({
          status:
            'READY',

          endpoint:
            'https://www.wikidata.org/wiki/Special:EntityData',

          timeoutMilliseconds:
            10000,

          defaultLanguage:
            'en',
        });
      },
    );

    it(
      'blocks invalid configuration',
      () => {
        const configuration =
          resolveWikidataConfiguration({
            endpoint:
              'invalid',

            timeoutMilliseconds:
              0,

            userAgent:
              '',

            defaultLanguage:
              '!',
          });

        expect(
          configuration.status,
        ).toBe(
          'BLOCKED',
        );

        expect(
          configuration.errors,
        ).toHaveLength(4);
      },
    );
  },
);
