import {
  PlaceCategory,
  PlaceNearbyRequest,
  PlaceNearbyResult,
  PlacesProvider,
} from '../../contracts';

import {
  resolveOverpassConfiguration,
} from './overpass.configuration';

import {
  classifyOverpassStatus,
  OverpassProviderError,
} from './overpass.errors';

import {
  isOverpassResponse,
  mapOverpassElement,
} from './overpass.mapper';

import {
  OverpassConfigurationInput,
} from './overpass.types';

export interface OverpassProviderDependencies {
  configuration?:
    OverpassConfigurationInput;

  fetchImplementation?:
    typeof fetch;
}

const CATEGORY_FILTERS:
  Readonly<
    Partial<
      Record<
        PlaceCategory,
        readonly string[]
      >
    >
  > = {
    HOSPITAL: [
      '["amenity"="hospital"]',
    ],

    PHARMACY: [
      '["amenity"="pharmacy"]',
    ],

    POLICE_STATION: [
      '["amenity"="police"]',
    ],

    FIRE_STATION: [
      '["amenity"="fire_station"]',
    ],

    RESTAURANT: [
      '["amenity"="restaurant"]',
    ],

    SCHOOL: [
      '["amenity"="school"]',
    ],

    BANK: [
      '["amenity"="bank"]',
    ],

    ATM: [
      '["amenity"="atm"]',
    ],

    SUPERMARKET: [
      '["shop"="supermarket"]',
    ],

    PARK: [
      '["leisure"="park"]',
    ],

    HOTEL: [
      '["tourism"="hotel"]',
    ],

    RAILWAY_STATION: [
      '["railway"="station"]',
    ],

    METRO_STATION: [
      '["railway"="subway_entrance"]',
    ],

    BUS_STOP: [
      '["highway"="bus_stop"]',
    ],
  };

const DEFAULT_FILTERS = [
  '["amenity"]',
  '["shop"]',
  '["tourism"]',
  '["leisure"]',
  '["railway"]',
  '["highway"="bus_stop"]',
];

function filtersFor(
  categories:
    readonly PlaceCategory[] |
    undefined,
): readonly string[] {
  if (
    !categories ||
    categories.length === 0
  ) {
    return DEFAULT_FILTERS;
  }

  const filters =
    categories.flatMap(
      (category) =>
        CATEGORY_FILTERS[
          category
        ] ?? [],
    );

  return filters.length > 0
    ? Array.from(
        new Set(
          filters,
        ),
      )
    : DEFAULT_FILTERS;
}

export class OverpassProvider
  implements PlacesProvider
{
  readonly name =
    'overpass';

  readonly capabilities = [
    'NEARBY_SEARCH',
  ] as const;

  private readonly configuration;

  private readonly fetchImplementation:
    typeof fetch;

  constructor(
    dependencies:
      OverpassProviderDependencies = {},
  ) {
    this.configuration =
      resolveOverpassConfiguration(
        dependencies.configuration,
      );

    if (
      this.configuration.status ===
        'BLOCKED'
    ) {
      throw new Error(
        `OVERPASS_CONFIGURATION_BLOCKED: ${this.configuration.errors.join('; ')}`,
      );
    }

    this.fetchImplementation =
      dependencies.fetchImplementation ??
      fetch;
  }

  async nearby(
    request:
      PlaceNearbyRequest,
  ): Promise<
    PlaceNearbyResult
  > {
    const query =
      this.buildQuery(
        request,
      );

    const body =
      await this.request(
        query,
      );

    if (
      !isOverpassResponse(
        body,
      )
    ) {
      throw new OverpassProviderError(
        'INVALID_PROVIDER_RESPONSE',
        'Overpass response must contain an elements array',
        false,
      );
    }

    const keyword =
      request.keyword
        ?.trim()
        .toLowerCase();

    const places =
      body.elements
        .map(
          (element) =>
            mapOverpassElement(
              element,
              request.coordinate,
              this.name,
            ),
        )
        .filter(
          (
            place,
          ): place is
            NonNullable<
              typeof place
            > =>
              Boolean(place),
        )
        .filter(
          (place) =>
            !keyword ||
            place.name
              .toLowerCase()
              .includes(
                keyword,
              ),
        )
        .sort(
          (
            left,
            right,
          ) =>
            (
              left.distanceMeters ??
              Number.MAX_VALUE
            ) -
            (
              right.distanceMeters ??
              Number.MAX_VALUE
            ),
        )
        .slice(
          0,
          request.limit ??
          20,
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
          'Overpass API',

        timestamp:
          body.osm3s
            ?.timestamp_osm_base,
      },
    };
  }

  private buildQuery(
    request:
      PlaceNearbyRequest,
  ): string {
    const {
      latitude,
      longitude,
    } =
      request.coordinate;

    const selectors =
      filtersFor(
        request.categories,
      ).map(
        (filter) =>
          `nwr(around:${request.radiusMeters},${latitude},${longitude})${filter};`,
      );

    return [
      `[out:json][timeout:${this.configuration.queryTimeoutSeconds}];`,
      '(',
      ...selectors,
      ');',
      'out center tags;',
    ].join('\n');
  }

  private async request(
    query:
      string,
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
          this.configuration
            .endpoint,
          {
            method:
              'POST',

            headers: {
              'Accept':
                'application/json',

              'Content-Type':
                'application/x-www-form-urlencoded;charset=UTF-8',

              'User-Agent':
                this.configuration
                  .userAgent,
            },

            body:
              new URLSearchParams({
                data:
                  query,
              }).toString(),

            signal:
              controller.signal,
          },
        );

      if (!response.ok) {
        throw classifyOverpassStatus(
          response.status,
        );
      }

      try {
        return await response.json();
      } catch {
        throw new OverpassProviderError(
          'INVALID_PROVIDER_RESPONSE',
          'Overpass returned invalid JSON',
          false,
          response.status,
        );
      }
    } catch (error) {
      if (
        error instanceof
          OverpassProviderError
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
        throw new OverpassProviderError(
          'OVERPASS_TIMEOUT',
          'Overpass request timed out',
          true,
        );
      }

      throw new OverpassProviderError(
        'OVERPASS_NETWORK_ERROR',
        error instanceof
          Error
          ? error.message
          : 'Overpass network request failed',
        true,
      );
    } finally {
      clearTimeout(
        timeout,
      );
    }
  }
}
