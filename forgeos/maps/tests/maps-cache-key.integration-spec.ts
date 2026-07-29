import {
  createMapsCacheKey,
} from '../index';

describe(
  'Maps cache keys',
  () => {
    it(
      'creates deterministic keys independent of object-property order',
      () => {
        const first =
          createMapsCacheKey({
            operation:
              'GEOCODE',

            request: {
              query:
                ' Chennai ',

              limit:
                5,

              countryCode:
                'IN',
            },

            selectionSignature: [
              'nominatim',
            ],
          });

        const second =
          createMapsCacheKey({
            operation:
              'GEOCODE',

            request: {
              countryCode:
                'IN',

              query:
                'Chennai',

              limit:
                5,
            },

            selectionSignature: [
              'nominatim',
            ],
          });

        expect(first)
          .toBe(second);

        expect(first)
          .toMatch(
            /^forgeos:maps:geocode:[a-f0-9]{64}$/,
          );
      },
    );

    it(
      'changes when provider selection changes',
      () => {
        const request = {
          operation:
            'GEOCODE' as const,

          request: {
            query:
              'Chennai',
          },
        };

        expect(
          createMapsCacheKey({
            ...request,

            selectionSignature: [
              'nominatim',
            ],
          }),
        ).not.toBe(
          createMapsCacheKey({
            ...request,

            selectionSignature: [
              'google',
            ],
          }),
        );
      },
    );
  },
);
