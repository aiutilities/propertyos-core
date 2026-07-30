import {
  OverpassProvider,
  PhotonProvider,
  WikidataProvider,
} from '@forgeos/places';

export interface PlacesRuntimeConfiguration {
  readonly searchProvider:
    PhotonProvider;

  readonly nearbyProvider:
    OverpassProvider;

  readonly detailsProvider:
    WikidataProvider;
}

export function createPlacesRuntimeConfiguration(): PlacesRuntimeConfiguration {
  return {
    searchProvider:
      new PhotonProvider(),

    nearbyProvider:
      new OverpassProvider(),

    detailsProvider:
      new WikidataProvider(),
  };
}
