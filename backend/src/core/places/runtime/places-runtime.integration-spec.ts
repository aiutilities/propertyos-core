import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PlacesRuntimeService,
} from './places-runtime.service';

describe(
  'PlacesRuntimeService',
  () => {
    it(
      'exposes initialized Places providers',
      () => {
        const service =
          new PlacesRuntimeService();

        expect(
          service.runtime
            .searchProvider
            .name,
        ).toBe(
          'photon',
        );

        expect(
          service.runtime
            .nearbyProvider
            .name,
        ).toBe(
          'overpass',
        );

        expect(
          service.runtime
            .detailsProvider
            .name,
        ).toBe(
          'wikidata',
        );
      },
    );
  },
);
