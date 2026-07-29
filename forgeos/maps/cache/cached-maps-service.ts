import {
  GeocodeRequest,
  NearbySearchRequest,
  ReverseGeocodeRequest,
  RouteRequest,
} from '../contracts';

import {
  MapsFallbackContext,
  MapsFallbackEngine,
  MapsFallbackResult,
} from '../fallback';

import {
  MapsLogger,
  NoopMapsLogger,
} from '../ports';

import {
  MapsProviderSelection,
} from '../selection';

import {
  createMapsCacheKey,
} from './maps-cache-key';

import {
  resolveMapsCachePolicy,
  MapsCachePolicy,
  MapsCachePolicyInput,
} from './maps-cache-policy';

import {
  MapsCacheStore,
} from './maps-cache-store';

import {
  MapsCachedResult,
  MapsCacheOperation,
} from './maps-cache.types';

export interface CachedMapsServiceDependencies {
  engine:
    MapsFallbackEngine;

  selection:
    MapsProviderSelection;

  cache:
    MapsCacheStore;

  policy?:
    MapsCachePolicyInput;

  logger?:
    MapsLogger;

  now?:
    () => number;
}

export class CachedMapsService {
  private readonly engine:
    MapsFallbackEngine;

  private readonly selection:
    MapsProviderSelection;

  private readonly cache:
    MapsCacheStore;

  private readonly policy:
    MapsCachePolicy;

  private readonly logger:
    MapsLogger;

  private readonly now:
    () => number;

  private readonly inFlight =
    new Map<
      string,
      Promise<
        MapsFallbackResult<unknown>
      >
    >();

  constructor(
    dependencies:
      CachedMapsServiceDependencies,
  ) {
    this.engine =
      dependencies.engine;

    this.selection =
      dependencies.selection;

    this.cache =
      dependencies.cache;

    this.policy =
      resolveMapsCachePolicy(
        dependencies.policy,
      );

    this.logger =
      dependencies.logger ??
      new NoopMapsLogger();

    this.now =
      dependencies.now ??
      Date.now;
  }

  async geocode(
    request:
      GeocodeRequest,

    context:
      MapsFallbackContext = {},
  ) {
    return this.execute(
      'GEOCODE',
      request,
      this.selection
        .select(
          'GEOCODING',
        )
        .providers,

      () =>
        this.engine.geocode(
          request,
          context,
        ),
    );
  }

  async reverseGeocode(
    request:
      ReverseGeocodeRequest,

    context:
      MapsFallbackContext = {},
  ) {
    return this.execute(
      'REVERSE_GEOCODE',
      request,
      this.selection
        .select(
          'REVERSE_GEOCODING',
        )
        .providers,

      () =>
        this.engine
          .reverseGeocode(
            request,
            context,
          ),
    );
  }

  async route(
    request:
      RouteRequest,

    context:
      MapsFallbackContext = {},
  ) {
    return this.execute(
      'ROUTE',
      request,
      this.selection
        .select(
          'ROUTING',
        )
        .providers,

      () =>
        this.engine.route(
          request,
          context,
        ),
    );
  }

  async nearbySearch(
    request:
      NearbySearchRequest,

    context:
      MapsFallbackContext = {},
  ) {
    return this.execute(
      'NEARBY_SEARCH',
      request,
      this.selection
        .select(
          'NEARBY_SEARCH',
        )
        .providers,

      () =>
        this.engine
          .nearbySearch(
            request,
            context,
          ),
    );
  }

  invalidate(
    cacheKey:
      string,
  ): boolean {
    return this.cache.delete(
      cacheKey,
    );
  }

  invalidateProvider(
    providerName:
      string,
  ): number {
    return this.cache
      .invalidateProvider(
        providerName,
      );
  }

  clear(): void {
    this.cache.clear();
  }

  private async execute<
    TResult,
  >(
    operation:
      MapsCacheOperation,

    request:
      unknown,

    selectionSignature:
      readonly string[],

    executor:
      () => Promise<
        MapsFallbackResult<TResult>
      >,
  ): Promise<
    MapsCachedResult<
      MapsFallbackResult<TResult>
    >
  > {
    const cacheKey =
      createMapsCacheKey({
        operation,
        request,
        selectionSignature,
      });

    if (
      this.policy.enabled
    ) {
      const cached =
        this.cache.get<
          MapsFallbackResult<TResult>
        >(
          cacheKey,
          this.now(),
        );

      if (cached) {
        this.logger.debug(
          'Maps cache hit',
          {
            operation,
            cacheKey,
          },
        );

        return {
          result:
            cached.value,

          metadata: {
            cache:
              'HIT',

            cacheKey,

            deduplicated:
              false,
          },
        };
      }
    }

    const existing =
      this.inFlight.get(
        cacheKey,
      );

    if (existing) {
      return {
        result:
          await existing as
            MapsFallbackResult<TResult>,

        metadata: {
          cache:
            'MISS',

          cacheKey,

          deduplicated:
            true,
        },
      };
    }

    const pending =
      executor() as Promise<
        MapsFallbackResult<unknown>
      >;

    this.inFlight.set(
      cacheKey,
      pending,
    );

    try {
      const result =
        await pending as
          MapsFallbackResult<TResult>;

      const shouldCache =
        this.policy.enabled &&
        (
          result.success ||
          this.policy
            .cacheFailures
        );

      if (shouldCache) {
        this.cache.set({
          key:
            cacheKey,

          operation,

          providerName:
            result.success
              ? result.providerName
              : undefined,

          value:
            result,

          ttlMilliseconds:
            this.policy
              .ttlMilliseconds[
                operation
              ],

          createdAt:
            this.now(),
        });
      }

      return {
        result,

        metadata: {
          cache:
            'MISS',

          cacheKey,

          deduplicated:
            false,
        },
      };
    } finally {
      this.inFlight.delete(
        cacheKey,
      );
    }
  }
}
