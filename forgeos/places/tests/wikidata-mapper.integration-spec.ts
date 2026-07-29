import {
  mapWikidataEntity,
} from '../index';

describe(
  'Wikidata mapper',
  () => {
    it(
      'maps entity data to normalized Place details',
      () => {
        expect(
          mapWikidataEntity(
            {
              id:
                'Q123',

              labels: {
                en: {
                  language:
                    'en',

                  value:
                    'Example Hospital',
                },
              },

              descriptions: {
                en: {
                  language:
                    'en',

                  value:
                    'Hospital in Chennai',
                },
              },

              claims: {
                P31: [
                  {
                    mainsnak: {
                      snaktype:
                        'value',

                      property:
                        'P31',

                      datavalue: {
                        type:
                          'wikibase-entityid',

                        value: {
                          id:
                            'Q16917',
                        },
                      },
                    },
                  },
                ],

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
                            13.0827,

                          longitude:
                            80.2707,
                        },
                      },
                    },
                  },
                ],

                P856: [
                  {
                    mainsnak: {
                      snaktype:
                        'value',

                      property:
                        'P856',

                      datavalue: {
                        type:
                          'string',

                        value:
                          'https://example.test',
                      },
                    },
                  },
                ],

                P18: [
                  {
                    mainsnak: {
                      snaktype:
                        'value',

                      property:
                        'P18',

                      datavalue: {
                        type:
                          'string',

                        value:
                          'Example Hospital.jpg',
                      },
                    },
                  },
                ],
              },

              sitelinks: {
                enwiki: {
                  site:
                    'enwiki',

                  title:
                    'Example Hospital',

                  url:
                    'https://en.wikipedia.org/wiki/Example_Hospital',
                },
              },
            },

            'en',

            'wikidata',
          ),
        ).toMatchObject({
          id:
            'Q123',

          providerName:
            'wikidata',

          name:
            'Example Hospital',

          coordinate: {
            latitude:
              13.0827,

            longitude:
              80.2707,
          },

          primaryCategory:
            'HOSPITAL',

          contact: {
            website:
              'https://example.test',
          },

          photos: [
            {
              reference:
                'Example Hospital.jpg',
            },
          ],

          metadata: {
            description:
              'Hospital in Chennai',

            wikipedia:
              'https://en.wikipedia.org/wiki/Example_Hospital',

            wikidataId:
              'Q123',
          },
        });
      },
    );

    it(
      'requires coordinates',
      () => {
        expect(
          mapWikidataEntity(
            {
              id:
                'Q123',

              labels: {
                en: {
                  language:
                    'en',

                  value:
                    'No Coordinate',
                },
              },
            },

            'en',

            'wikidata',
          ),
        ).toBeUndefined();
      },
    );
  },
);
