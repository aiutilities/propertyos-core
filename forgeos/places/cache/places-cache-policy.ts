import {
  PlacesCacheOperation,
} from './places-cache.types';

export interface PlacesCachePolicyInput {
  enabled?:
    boolean;

  cacheFailures?:
    boolean;

  ttlMilliseconds?:
    Partial<
      Record<
        PlacesCacheOperation,
        number
      >
    >;
}

export interface PlacesCachePolicy {
  enabled:
    boolean;

  cacheFailures:
    boolean;

  ttlMilliseconds:
    Record<
      PlacesCacheOperation,
      number
    >;
}

const DEFAULT_TTL:
  Record<
    PlacesCacheOperation,
    number
  > = {
    PLACE_SEARCH:
      15 * 60 * 1000,

    NEARBY_SEARCH:
      10 * 60 * 1000,

    PLACE_DETAILS:
      60 * 60 * 1000,
  };

export function resolvePlacesCachePolicy(
  input:
    PlacesCachePolicyInput = {},
): PlacesCachePolicy {
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
        `PLACES_CACHE_CONFIGURATION_INVALID: ${operation}`,
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
