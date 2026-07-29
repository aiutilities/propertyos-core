import {
  PlacesCacheEntry,
  PlacesCacheSetInput,
  PlacesCacheStats,
} from './places-cache.types';

export interface PlacesCacheStore {
  get<
    TValue,
  >(
    key:
      string,

    now:
      number,
  ): PlacesCacheEntry<TValue> | undefined;

  set<
    TValue,
  >(
    input:
      PlacesCacheSetInput<TValue>,
  ): void;

  delete(
    key:
      string,
  ): boolean;

  invalidateProvider(
    providerName:
      string,
  ): number;

  clear(): void;

  stats():
    PlacesCacheStats;
}
