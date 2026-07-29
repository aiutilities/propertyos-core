import {
  PlaceDetailsRequest,
  PlaceNearbyRequest,
  PlaceSearchRequest,
} from '../contracts';

import {
  PlacesFallbackContext,
  PlacesFallbackEngine,
  PlacesFallbackResult,
} from '../fallback';

import {
  PlacesProviderSelection,
} from '../selection';

import {
  createPlacesCacheKey,
} from './places-cache-key';

import {
  PlacesCachePolicyInput,
  resolvePlacesCachePolicy,
} from './places-cache-policy';

import {
  PlacesCacheStore,
} from './places-cache-store';

import {
  PlacesCachedResult,
  PlacesCacheOperation,
} from './places-cache.types';

export interface CachedPlacesServiceDependencies {
  engine:
    PlacesFallbackEngine;

  selection:
    PlacesProviderSelection;

  cache:
    PlacesCacheStore;

  policy?:
    PlacesCachePolicyInput;

  now?:
    () => number;
}

export class CachedPlacesService {
  private readonly policy;

  private readonly now:
    () => number;

  private readonly inFlight =
    new Map<
      string,
      Promise<
        PlacesFallbackResult<unknown>
      >
    >();

  constructor(
    private readonly dependencies:
      CachedPlacesServiceDependencies,
  ) {
    this.policy =
      resolvePlacesCachePolicy(
        dependencies.policy,
      );

    this.now =
      dependencies.now ??
      Date.now;
  }

  async search(
    request:
      PlaceSearchRequest,

    context:
      PlacesFallbackContext = {},
  ) {
    return this.execute(
      'PLACE_SEARCH',

      request,

      this.dependencies
        .selection
        .select(
          'PLACE_SEARCH',
        )
        .providers,

      () =>
        this.dependencies
          .engine
          .search(
            request,
            context,
          ),
    );
  }

  async nearby(
    request:
      PlaceNearbyRequest,

    context:
      PlacesFallbackContext = {},
  ) {
    return this.execute(
      'NEARBY_SEARCH',

      request,

      this.dependencies
        .selection
        .select(
          'NEARBY_SEARCH',
        )
        .providers,

      () =>
        this.dependencies
          .engine
          .nearby(
            request,
            context,
          ),
    );
  }

  async details(
    request:
      PlaceDetailsRequest,

    context:
      PlacesFallbackContext = {},
  ) {
    const providers =
      request.providerName
        ? [
            request.providerName,
          ]
        : this.dependencies
            .selection
            .select(
              'PLACE_DETAILS',
            )
            .providers;

    return this.execute(
      'PLACE_DETAILS',

      request,

      providers,

      () =>
        this.dependencies
          .engine
          .details(
            request,
            context,
          ),
    );
  }

  invalidate(
    cacheKey:
      string,
  ): boolean {
    return this.dependencies
      .cache
      .delete(
        cacheKey,
      );
  }

  invalidateProvider(
    providerName:
      string,
  ): number {
    return this.dependencies
      .cache
      .invalidateProvider(
        providerName,
      );
  }

  clear(): void {
    this.dependencies
      .cache
      .clear();
  }

  private async execute<
    TResult,
  >(
    operation:
      PlacesCacheOperation,

    request:
      unknown,

    providers:
      readonly string[],

    executor:
      () => Promise<
        PlacesFallbackResult<TResult>
      >,
  ): Promise<
    PlacesCachedResult<
      PlacesFallbackResult<TResult>
    >
  > {
    const cacheKey =
      createPlacesCacheKey({
        operation,
        request,
        providerSignature:
          providers,
      });

    if (
      this.policy.enabled
    ) {
      const cached =
        this.dependencies
          .cache
          .get<
            PlacesFallbackResult<TResult>
          >(
            cacheKey,
            this.now(),
          );

      if (cached) {
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
            PlacesFallbackResult<TResult>,

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
        PlacesFallbackResult<unknown>
      >;

    this.inFlight.set(
      cacheKey,
      pending,
    );

    try {
      const result =
        await pending as
          PlacesFallbackResult<TResult>;

      if (
        this.policy.enabled &&
        (
          result.success ||
          this.policy
            .cacheFailures
        )
      ) {
        this.dependencies
          .cache
          .set({
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
