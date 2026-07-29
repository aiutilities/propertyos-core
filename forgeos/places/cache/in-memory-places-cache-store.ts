import {
  PlacesCacheStore,
} from './places-cache-store';

import {
  PlacesCacheEntry,
  PlacesCacheSetInput,
  PlacesCacheStats,
} from './places-cache.types';

export interface InMemoryPlacesCacheStoreOptions {
  maximumEntries?:
    number;
}

export class InMemoryPlacesCacheStore
  implements PlacesCacheStore
{
  private readonly entries =
    new Map<
      string,
      PlacesCacheEntry
    >();

  private readonly maximumEntries:
    number;

  private hits =
    0;

  private misses =
    0;

  private writes =
    0;

  private evictions =
    0;

  constructor(
    options:
      InMemoryPlacesCacheStoreOptions = {},
  ) {
    const maximumEntries =
      options.maximumEntries ??
      1000;

    if (
      !Number.isInteger(
        maximumEntries,
      ) ||
      maximumEntries < 1
    ) {
      throw new Error(
        'PLACES_CACHE_CONFIGURATION_INVALID',
      );
    }

    this.maximumEntries =
      maximumEntries;
  }

  get<
    TValue,
  >(
    key:
      string,

    now:
      number,
  ): PlacesCacheEntry<TValue> | undefined {
    const entry =
      this.entries.get(
        key,
      );

    if (!entry) {
      this.misses +=
        1;

      return undefined;
    }

    if (
      entry.expiresAt <=
      now
    ) {
      this.entries.delete(
        key,
      );

      this.misses +=
        1;

      return undefined;
    }

    this.entries.delete(
      key,
    );

    this.entries.set(
      key,
      entry,
    );

    this.hits +=
      1;

    return entry as
      PlacesCacheEntry<TValue>;
  }

  set<
    TValue,
  >(
    input:
      PlacesCacheSetInput<TValue>,
  ): void {
    this.entries.delete(
      input.key,
    );

    while (
      this.entries.size >=
      this.maximumEntries
    ) {
      const oldestKey =
        this.entries
          .keys()
          .next()
          .value as
            string |
            undefined;

      if (!oldestKey) {
        break;
      }

      this.entries.delete(
        oldestKey,
      );

      this.evictions +=
        1;
    }

    this.entries.set(
      input.key,
      {
        ...input,

        expiresAt:
          input.createdAt +
          input.ttlMilliseconds,
      },
    );

    this.writes +=
      1;
  }

  delete(
    key:
      string,
  ): boolean {
    return this.entries.delete(
      key,
    );
  }

  invalidateProvider(
    providerName:
      string,
  ): number {
    let count =
      0;

    for (
      const [
        key,
        entry,
      ] of
        this.entries
    ) {
      if (
        entry.providerName ===
          providerName
      ) {
        this.entries.delete(
          key,
        );

        count +=
          1;
      }
    }

    return count;
  }

  clear(): void {
    this.entries.clear();
  }

  stats():
    PlacesCacheStats {
    return {
      entries:
        this.entries.size,

      hits:
        this.hits,

      misses:
        this.misses,

      writes:
        this.writes,

      evictions:
        this.evictions,
    };
  }
}
