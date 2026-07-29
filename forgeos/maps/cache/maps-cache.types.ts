export type MapsCacheOperation =
  | 'GEOCODE'
  | 'REVERSE_GEOCODE'
  | 'ROUTE'
  | 'NEARBY_SEARCH';

export interface MapsCacheEntry<
  TValue = unknown,
> {
  key:
    string;

  operation:
    MapsCacheOperation;

  providerName?:
    string;

  value:
    TValue;

  createdAt:
    number;

  expiresAt:
    number;
}

export interface MapsCacheSetInput<
  TValue = unknown,
> {
  key:
    string;

  operation:
    MapsCacheOperation;

  providerName?:
    string;

  value:
    TValue;

  ttlMilliseconds:
    number;

  createdAt:
    number;
}

export interface MapsCacheStats {
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

export interface MapsCacheResultMetadata {
  cache:
    'HIT' |
    'MISS';

  cacheKey:
    string;

  deduplicated:
    boolean;
}

export interface MapsCachedResult<
  TResult,
> {
  result:
    TResult;

  metadata:
    MapsCacheResultMetadata;
}
