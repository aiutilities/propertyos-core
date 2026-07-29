import {
  GeocodeRequest,
  GeocodeResult,
  MapsProvider,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
} from '../../contracts';

import {
  classifyNominatimFailure,
  NominatimProviderError,
} from './nominatim.errors';

import {
  isNominatimPlaceResponse,
  mapNominatimPlace,
} from './nominatim.mapper';

import {
  resolveNominatimConfiguration,
} from './nominatim.configuration';

import {
  NominatimConfigurationInput,
  NominatimErrorResponse,
} from './nominatim.types';

export interface NominatimProviderDependencies {
  configuration:
    NominatimConfigurationInput;

  fetchImplementation?:
    typeof fetch;

  now?:
    () => number;

  sleep?:
    (
      milliseconds:
        number,
    ) => Promise<void>;
}

export class NominatimProvider
  implements MapsProvider
{
  readonly name =
    'nominatim';

  readonly capabilities = [
    'GEOCODING',
    'REVERSE_GEOCODING',
  ] as const;

  private readonly configuration;

  private readonly fetchImplementation:
    typeof fetch;

  private readonly now:
    () => number;

  private readonly sleep:
    (
      milliseconds:
        number,
    ) => Promise<void>;

  private lastRequestStartedAt:
    number | undefined;

  constructor(
    dependencies:
      NominatimProviderDependencies,
  ) {
    this.configuration =
      resolveNominatimConfiguration(
        dependencies.configuration,
      );

    if (
      this.configuration.status ===
        'BLOCKED'
    ) {
      throw new Error(
        `NOMINATIM_CONFIGURATION_BLOCKED: ${this.configuration.errors.join('; ')}`,
      );
    }

    this.fetchImplementation =
      dependencies.fetchImplementation ??
      fetch;

    this.now =
      dependencies.now ??
      Date.now;

    this.sleep =
      dependencies.sleep ??
      (
        async (
          milliseconds,
        ) =>
          new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                milliseconds,
              ),
          )
      );
  }

  async geocode(
    request:
      GeocodeRequest,
  ): Promise<
    GeocodeResult
  > {
    const url =
      new URL(
        `${this.configuration.endpoint}/search`,
      );

    url.searchParams.set(
      'q',
      request.query,
    );

    url.searchParams.set(
      'format',
      'jsonv2',
    );

    url.searchParams.set(
      'addressdetails',
      '1',
    );

    url.searchParams.set(
      'namedetails',
      '1',
    );

    url.searchParams.set(
      'extratags',
      '1',
    );

    url.searchParams.set(
      'limit',
      String(
        request.limit ??
        10,
      ),
    );

    if (
      request.countryCode
    ) {
      url.searchParams.set(
        'countrycodes',
        request.countryCode
          .toLowerCase(),
      );
    }

    if (
      request.language
    ) {
      url.searchParams.set(
        'accept-language',
        request.language,
      );
    }

    if (
      request.bounds
    ) {
      url.searchParams.set(
        'viewbox',
        [
          request.bounds
            .southWest
            .longitude,
          request.bounds
            .northEast
            .latitude,
          request.bounds
            .northEast
            .longitude,
          request.bounds
            .southWest
            .latitude,
        ].join(','),
      );
    }

    const body =
      await this.request(
        url,
      );

    if (!Array.isArray(body)) {
      throw new NominatimProviderError(
        'INVALID_PROVIDER_RESPONSE',
        'Nominatim search response must be an array',
        false,
      );
    }

    const places =
      body
        .filter(
          isNominatimPlaceResponse,
        )
        .map(
          (place) =>
            mapNominatimPlace(
              place,
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
      },
    };
  }

  async reverseGeocode(
    request:
      ReverseGeocodeRequest,
  ): Promise<
    ReverseGeocodeResult
  > {
    const url =
      new URL(
        `${this.configuration.endpoint}/reverse`,
      );

    url.searchParams.set(
      'lat',
      String(
        request.coordinate
          .latitude,
      ),
    );

    url.searchParams.set(
      'lon',
      String(
        request.coordinate
          .longitude,
      ),
    );

    url.searchParams.set(
      'format',
      'jsonv2',
    );

    url.searchParams.set(
      'addressdetails',
      '1',
    );

    url.searchParams.set(
      'namedetails',
      '1',
    );

    url.searchParams.set(
      'extratags',
      '1',
    );

    if (
      request.language
    ) {
      url.searchParams.set(
        'accept-language',
        request.language,
      );
    }

    const body =
      await this.request(
        url,
      );

    const places =
      isNominatimPlaceResponse(
        body,
      )
        ? [
            mapNominatimPlace(
              body,
              this.name,
            ),
          ]
        : [];

    return {
      providerName:
        this.name,

      places:
        request.limit ===
          undefined
          ? places
          : places.slice(
              0,
              request.limit,
            ),

      metadata: {
        attribution:
          '© OpenStreetMap contributors',

        licence:
          'Open Database License',
      },
    };
  }

  private async request(
    url:
      URL,
  ): Promise<unknown> {
    await this.waitForRateLimit();

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
      this.lastRequestStartedAt =
        this.now();

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
                  .userAgent!,

              ...(this.configuration
                .email
                ? {
                    'From':
                      this.configuration
                        .email,
                  }
                : {}),
            },

            signal:
              controller.signal,
          },
        );

      let body:
        unknown;

      try {
        body =
          await response.json();
      } catch {
        body =
          undefined;
      }

      if (!response.ok) {
        const classification =
          classifyNominatimFailure(
            response.status,
          );

        const message =
          typeof body ===
            'object' &&
          body !== null &&
          typeof (
            body as
              NominatimErrorResponse
          ).error ===
            'string'
            ? (
                body as
                  NominatimErrorResponse
              ).error!
            : `Nominatim request failed with HTTP ${response.status}`;

        throw new NominatimProviderError(
          classification.errorCode,
          message,
          classification.retryable,
        );
      }

      return body;
    } catch (error) {
      if (
        error instanceof
          NominatimProviderError
      ) {
        throw error;
      }

      if (
        error instanceof Error &&
        error.name ===
          'AbortError'
      ) {
        throw new NominatimProviderError(
          'PROVIDER_TIMEOUT',
          'Nominatim request timed out',
          true,
        );
      }

      throw new NominatimProviderError(
        'PROVIDER_UNAVAILABLE',
        'Nominatim request failed',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async waitForRateLimit():
    Promise<void> {
    if (
      this.lastRequestStartedAt ===
        undefined
    ) {
      return;
    }

    const elapsed =
      this.now() -
      this.lastRequestStartedAt;

    const remaining =
      this.configuration
        .minimumRequestIntervalMilliseconds -
      elapsed;

    if (remaining > 0) {
      await this.sleep(
        remaining,
      );
    }
  }
}
