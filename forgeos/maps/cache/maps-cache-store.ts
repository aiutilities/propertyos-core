import {
  MapsCacheEntry,
  MapsCacheSetInput,
  MapsCacheStats,
} from './maps-cache.types';

export interface MapsCacheStore {
  get<
    TValue,
  >(
    key:
      string,

    now:
      number,
  ): MapsCacheEntry<TValue> | undefined;

  set<
    TValue,
  >(
    input:
      MapsCacheSetInput<TValue>,
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
    MapsCacheStats;
}
