import {
  PlaceSearchRequest,
  PlaceSearchResult,
  PlacesProvider,
} from '../../contracts';

import {
  resolvePhotonConfiguration,
} from './photon.configuration';

import {
  classifyPhotonStatus,
  PhotonProviderError,
} from './photon.errors';

import {
  isPhotonFeature,
  isPhotonFeatureCollection,
  mapPhotonFeature,
} from './photon.mapper';

import {
  PhotonConfigurationInput,
} from './photon.types';

export interface PhotonProviderDependencies {
  configuration?:
    PhotonConfigurationInput;

  fetchImplementation?:
    typeof fetch;
}

export class PhotonProvider
  implements PlacesProvider
{
  readonly name =
    'photon';

  readonly capabilities = [
    'PLACE_SEARCH',
  ] as const;

  private readonly configuration;

  private readonly fetchImplementation:
    typeof fetch;

  constructor(
    dependencies:
      PhotonProviderDependencies = {},
  ) {
    this.configuration =
      resolvePhotonConfiguration(
        dependencies.configuration,
      );

    if (
      this.configuration.status ===
        'BLOCKED'
    ) {
      throw new Error(
        `PHOTON_CONFIGURATION_BLOCKED: ${this.configuration.errors.join('; ')}`,
      );
    }

    this.fetchImplementation =
      dependencies.fetchImplementation ??
      fetch;
  }

  async search(
    request:
      PlaceSearchRequest,
  ): Promise<
    PlaceSearchResult
  > {
    const url =
      new URL(
        `${this.configuration.endpoint}/api`,
      );

    url.searchParams.set(
      'q',
      request.query,
    );

    url.searchParams.set(
      'limit',
      String(
        request.limit ??
        10,
      ),
    );

    if (
      request.language
    ) {
      url.searchParams.set(
        'lang',
        request.language,
      );
    }

    if (
      request.countryCode
    ) {
      url.searchParams.append(
        'countrycode',
        request.countryCode
          .toUpperCase(),
      );
    }

    if (
      request.coordinateBias
    ) {
      url.searchParams.set(
        'lat',
        String(
          request
            .coordinateBias
            .latitude,
        ),
      );

      url.searchParams.set(
        'lon',
        String(
          request
            .coordinateBias
            .longitude,
        ),
      );
    }

    if (
      request.bounds
    ) {
      url.searchParams.set(
        'bbox',
        [
          request.bounds
            .southWest
            .longitude,

          request.bounds
            .southWest
            .latitude,

          request.bounds
            .northEast
            .longitude,

          request.bounds
            .northEast
            .latitude,
        ].join(','),
      );
    }

    const body =
      await this.request(
        url,
      );

    if (
      !isPhotonFeatureCollection(
        body,
      )
    ) {
      throw new PhotonProviderError(
        'INVALID_PROVIDER_RESPONSE',
        'Photon response must be a GeoJSON FeatureCollection',
        false,
      );
    }

    const places =
      body.features
        .filter(
          isPhotonFeature,
        )
        .map(
          (feature) =>
            mapPhotonFeature(
              feature,
              this.name,
            ),
        );

    return {
      providerName:
        this.name,

      places,

      metadata: {
        attribution:
          '© OpenStreetMap contributors',

        licence:
          'Open Database License',

        provider:
          'Photon',
      },
    };
  }

  private async request(
    url:
      URL,
  ): Promise<unknown> {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),

        this.configuration
          .timeoutMilliseconds,
      );

    try {
      const response =
        await this.fetchImplementation(
          url,
          {
            method:
              'GET',

            headers: {
              'Accept':
                'application/json',

              'User-Agent':
                this.configuration
                  .userAgent,
            },

            signal:
              controller.signal,
          },
        );

      if (!response.ok) {
        throw classifyPhotonStatus(
          response.status,
        );
      }

      try {
        return await response.json();
      } catch {
        throw new PhotonProviderError(
          'INVALID_PROVIDER_RESPONSE',
          'Photon returned invalid JSON',
          false,
          response.status,
        );
      }
    } catch (error) {
      if (
        error instanceof
          PhotonProviderError
      ) {
        throw error;
      }

      if (
        typeof error ===
          'object' &&
        error !== null &&
        (
          error as {
            name?:
              unknown;
          }
        ).name ===
          'AbortError'
      ) {
        throw new PhotonProviderError(
          'PHOTON_TIMEOUT',
          'Photon request timed out',
          true,
        );
      }

      throw new PhotonProviderError(
        'PHOTON_NETWORK_ERROR',
        error instanceof
          Error
          ? error.message
          : 'Photon network request failed',
        true,
      );
    } finally {
      clearTimeout(
        timeout,
      );
    }
  }
}
