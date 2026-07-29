import {
  MapsCacheStore,
} from './maps-cache-store';

import {
  MapsCacheEntry,
  MapsCacheSetInput,
  MapsCacheStats,
} from './maps-cache.types';

export interface InMemoryMapsCacheStoreOptions {
  maximumEntries?:
    number;
}

export class InMemoryMapsCacheStore
  implements MapsCacheStore
{
  private readonly entries =
    new Map<
      string,
      MapsCacheEntry
    >();

  private readonly maximumEntries:
    number;

  private hitCount =
    0;

  private missCount =
    0;

  private writeCount =
    0;

  private evictionCount =
    0;

  constructor(
    options:
      InMemoryMapsCacheStoreOptions = {},
  ) {
    const maximumEntries =
      options.maximumEntries ??
      1_000;

    if (
      !Number.isInteger(
        maximumEntries,
      ) ||
      maximumEntries < 1
    ) {
      throw new Error(
        'MAPS_CACHE_CONFIGURATION_INVALID: maximumEntries must be a positive integer',
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
  ): MapsCacheEntry<TValue> | undefined {
    const entry =
      this.entries.get(
        key,
      );

    if (!entry) {
      this.missCount +=
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

      this.missCount +=
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

    this.hitCount +=
      1;

    return entry as
      MapsCacheEntry<TValue>;
  }

  set<
    TValue,
  >(
    input:
      MapsCacheSetInput<TValue>,
  ): void {
    if (
      !Number.isInteger(
        input.ttlMilliseconds,
      ) ||
      input.ttlMilliseconds < 1
    ) {
      throw new Error(
        'MAPS_CACHE_TTL_INVALID: TTL must be a positive integer',
      );
    }

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

      if (
        oldestKey ===
          undefined
      ) {
        break;
      }

      this.entries.delete(
        oldestKey,
      );

      this.evictionCount +=
        1;
    }

    this.entries.set(
      input.key,
      {
        key:
          input.key,

        operation:
          input.operation,

        providerName:
          input.providerName,

        value:
          input.value,

        createdAt:
          input.createdAt,

        expiresAt:
          input.createdAt +
          input.ttlMilliseconds,
      },
    );

    this.writeCount +=
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
    let removed =
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

        removed +=
          1;
      }
    }

    return removed;
  }

  clear(): void {
    this.entries.clear();
  }

  stats():
    MapsCacheStats {
    return {
      entries:
        this.entries.size,

      hits:
        this.hitCount,

      misses:
        this.missCount,

      writes:
        this.writeCount,

      evictions:
        this.evictionCount,
    };
  }
}
