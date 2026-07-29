import {
  MapsProvider,
  MapTravelMode,
  RouteRequest,
  RouteResult,
} from '../../contracts';

import {
  resolveOsrmConfiguration,
} from './osrm.configuration';

import {
  classifyOsrmCode,
  classifyOsrmHttpFailure,
  OsrmProviderError,
} from './osrm.errors';

import {
  mapOsrmRoute,
} from './osrm.mapper';

import {
  OsrmConfigurationInput,
  OsrmRouteEnvelope,
} from './osrm.types';

export interface OsrmProviderDependencies {
  configuration?:
    OsrmConfigurationInput;

  fetchImplementation?:
    typeof fetch;
}

export class OsrmProvider
  implements MapsProvider
{
  readonly name =
    'osrm';

  readonly capabilities = [
    'ROUTING',
  ] as const;

  private readonly configuration;

  private readonly fetchImplementation:
    typeof fetch;

  constructor(
    dependencies:
      OsrmProviderDependencies = {},
  ) {
    this.configuration =
      resolveOsrmConfiguration(
        dependencies.configuration ??
        {},
      );

    if (
      this.configuration.status ===
        'BLOCKED'
    ) {
      throw new Error(
        `OSRM_CONFIGURATION_BLOCKED: ${this.configuration.errors.join('; ')}`,
      );
    }

    this.fetchImplementation =
      dependencies.fetchImplementation ??
      fetch;
  }

  async route(
    request:
      RouteRequest,
  ): Promise<
    RouteResult
  > {
    const travelMode =
      request.travelMode ??
      'DRIVING';

    const profile =
      this.resolveProfile(
        travelMode,
      );

    const coordinates = [
      request.origin,
      ...(
        request.waypoints ??
        []
      ),
      request.destination,
    ]
      .map(
        (point) =>
          `${point.longitude},${point.latitude}`,
      )
      .join(';');

    const url =
      new URL(
        `${this.configuration.endpoint}/route/v1/${encodeURIComponent(profile)}/${coordinates}`,
      );

    url.searchParams.set(
      'alternatives',
      request.alternatives
        ? 'true'
        : 'false',
    );

    url.searchParams.set(
      'steps',
      'true',
    );

    url.searchParams.set(
      'geometries',
      'geojson',
    );

    url.searchParams.set(
      'overview',
      'full',
    );

    const body =
      await this.request(
        url,
      );

    if (
      typeof body !==
        'object' ||
      body === null
    ) {
      throw new OsrmProviderError(
        'INVALID_PROVIDER_RESPONSE',
        'OSRM route response must be an object',
        false,
      );
    }

    const envelope =
      body as
        OsrmRouteEnvelope;

    if (
      envelope.code !==
        'Ok'
    ) {
      const classification =
        classifyOsrmCode(
          envelope.code,
        );

      throw new OsrmProviderError(
        classification.errorCode,
        envelope.message ??
          `OSRM returned ${envelope.code}`,
        classification.retryable,
      );
    }

    if (
      !Array.isArray(
        envelope.routes,
      )
    ) {
      throw new OsrmProviderError(
        'INVALID_PROVIDER_RESPONSE',
        'OSRM successful response must include routes',
        false,
      );
    }

    return {
      providerName:
        this.name,

      routes:
        envelope.routes.map(
          (
            route,
            index,
          ) =>
            mapOsrmRoute(
              route,
              this.name,
              index,
            ),
        ),

      metadata: {
        profile,
        travelMode,
        attribution:
          '© OpenStreetMap contributors',
      },
    };
  }

  private resolveProfile(
    travelMode:
      MapTravelMode,
  ): string {
    const profile =
      this.configuration
        .profiles[
          travelMode
        ];

    if (!profile) {
      throw new OsrmProviderError(
        'TRAVEL_MODE_NOT_SUPPORTED',
        `OSRM travel mode is not configured: ${travelMode}`,
        false,
      );
    }

    return profile;
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
              Accept:
                'application/json',

              ...(this.configuration
                .userAgent
                ? {
                    'User-Agent':
                      this.configuration
                        .userAgent,
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
          classifyOsrmHttpFailure(
            response.status,
          );

        throw new OsrmProviderError(
          classification.errorCode,
          `OSRM request failed with HTTP ${response.status}`,
          classification.retryable,
        );
      }

      return body;
    } catch (error) {
      if (
        error instanceof
          OsrmProviderError
      ) {
        throw error;
      }

      if (
        error instanceof Error &&
        error.name ===
          'AbortError'
      ) {
        throw new OsrmProviderError(
          'PROVIDER_TIMEOUT',
          'OSRM request timed out',
          true,
        );
      }

      throw new OsrmProviderError(
        'PROVIDER_UNAVAILABLE',
        'OSRM request failed',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
