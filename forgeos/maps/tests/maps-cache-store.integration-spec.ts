import {
  InMemoryMapsCacheStore,
} from '../index';

describe(
  'InMemoryMapsCacheStore',
  () => {
    it(
      'stores and expires values',
      () => {
        const store =
          new InMemoryMapsCacheStore();

        store.set({
          key:
            'one',

          operation:
            'GEOCODE',

          value: {
            success:
              true,
          },

          ttlMilliseconds:
            1000,

          createdAt:
            100,
        });

        expect(
          store.get(
            'one',
            500,
          )?.value,
        ).toEqual({
          success:
            true,
        });

        expect(
          store.get(
            'one',
            1100,
          ),
        ).toBeUndefined();
      },
    );

    it(
      'evicts the least-recently-used entry',
      () => {
        const store =
          new InMemoryMapsCacheStore({
            maximumEntries:
              2,
          });

        store.set({
          key:
            'one',
          operation:
            'GEOCODE',
          value:
            1,
          ttlMilliseconds:
            1000,
          createdAt:
            0,
        });

        store.set({
          key:
            'two',
          operation:
            'GEOCODE',
          value:
            2,
          ttlMilliseconds:
            1000,
          createdAt:
            0,
        });

        store.get(
          'one',
          1,
        );

        store.set({
          key:
            'three',
          operation:
            'GEOCODE',
          value:
            3,
          ttlMilliseconds:
            1000,
          createdAt:
            1,
        });

        expect(
          store.get(
            'two',
            2,
          ),
        ).toBeUndefined();

        expect(
          store.get(
            'one',
            2,
          )?.value,
        ).toBe(1);

        expect(
          store.stats()
            .evictions,
        ).toBe(1);
      },
    );

    it(
      'invalidates entries by provider',
      () => {
        const store =
          new InMemoryMapsCacheStore();

        for (
          const providerName of
            [
              'nominatim',
              'osrm',
            ]
        ) {
          store.set({
            key:
              providerName,

            operation:
              'GEOCODE',

            providerName,

            value:
              providerName,

            ttlMilliseconds:
              1000,

            createdAt:
              0,
          });
        }

        expect(
          store.invalidateProvider(
            'nominatim',
          ),
        ).toBe(1);

        expect(
          store.get(
            'nominatim',
            1,
          ),
        ).toBeUndefined();

        expect(
          store.get(
            'osrm',
            1,
          )?.value,
        ).toBe(
          'osrm',
        );
      },
    );
  },
);
