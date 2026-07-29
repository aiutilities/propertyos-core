import {
  MapsCacheOperation,
} from './maps-cache.types';

export interface MapsCachePolicyInput {
  enabled?:
    boolean;

  cacheFailures?:
    boolean;

  ttlMilliseconds?:
    Partial<
      Record<
        MapsCacheOperation,
        number
      >
    >;
}

export interface MapsCachePolicy {
  enabled:
    boolean;

  cacheFailures:
    boolean;

  ttlMilliseconds:
    Record<
      MapsCacheOperation,
      number
    >;
}

const DEFAULT_TTL:
  Record<
    MapsCacheOperation,
    number
  > = {
    GEOCODE:
      24 * 60 * 60 * 1_000,

    REVERSE_GEOCODE:
      24 * 60 * 60 * 1_000,

    ROUTE:
      15 * 60 * 1_000,

    NEARBY_SEARCH:
      10 * 60 * 1_000,
  };

export function resolveMapsCachePolicy(
  input:
    MapsCachePolicyInput = {},
): MapsCachePolicy {
  const ttlMilliseconds = {
    ...DEFAULT_TTL,
    ...input.ttlMilliseconds,
  };

  for (
    const [
      operation,
      ttl,
    ] of
      Object.entries(
        ttlMilliseconds,
      )
  ) {
    if (
      !Number.isInteger(
        ttl,
      ) ||
      ttl < 1
    ) {
      throw new Error(
        `MAPS_CACHE_CONFIGURATION_INVALID: ${operation} TTL must be a positive integer`,
      );
    }
  }

  return {
    enabled:
      input.enabled ??
      true,

    cacheFailures:
      input.cacheFailures ??
      false,

    ttlMilliseconds,
  };
}
