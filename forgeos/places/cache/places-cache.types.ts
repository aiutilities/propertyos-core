export type PlacesCacheOperation =
  | 'PLACE_SEARCH'
  | 'NEARBY_SEARCH'
  | 'PLACE_DETAILS';

export interface PlacesCacheEntry<
  TValue = unknown,
> {
  key:
    string;

  operation:
    PlacesCacheOperation;

  providerName?:
    string;

  value:
    TValue;

  createdAt:
    number;

  expiresAt:
    number;
}

export interface PlacesCacheSetInput<
  TValue = unknown,
> {
  key:
    string;

  operation:
    PlacesCacheOperation;

  providerName?:
    string;

  value:
    TValue;

  ttlMilliseconds:
    number;

  createdAt:
    number;
}

export interface PlacesCacheStats {
  entries:
    number;

  hits:
    number;

  misses:
    number;

  writes:
    number;

  evictions:
    number;
}

export interface PlacesCacheMetadata {
  cache:
    'HIT' |
    'MISS';

  cacheKey:
    string;

  deduplicated:
    boolean;
}

export interface PlacesCachedResult<
  TResult,
> {
  result:
    TResult;

  metadata:
    PlacesCacheMetadata;
}
