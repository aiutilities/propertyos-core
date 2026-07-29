export interface PlacesProviderHealth {
  providerName:
    string;

  consecutiveFailures:
    number;

  lastSuccessAt?:
    number;

  lastFailureAt?:
    number;

  unhealthyUntil?:
    number;
}

export interface PlacesProviderHealthStore {
  get(
    providerName:
      string,
  ): PlacesProviderHealth;

  recordSuccess(
    providerName:
      string,

    now:
      number,
  ): void;

  recordFailure(
    providerName:
      string,

    now:
      number,

    cooldownMilliseconds:
      number,
  ): void;

  isHealthy(
    providerName:
      string,

    now:
      number,
  ): boolean;

  list():
    readonly PlacesProviderHealth[];
}

export class InMemoryPlacesProviderHealthStore
  implements PlacesProviderHealthStore
{
  private readonly health =
    new Map<
      string,
      PlacesProviderHealth
    >();

  get(
    providerName:
      string,
  ): PlacesProviderHealth {
    const normalized =
      providerName
        .trim()
        .toLowerCase();

    return this.health.get(
      normalized,
    ) ?? {
      providerName:
        normalized,

      consecutiveFailures:
        0,
    };
  }

  recordSuccess(
    providerName:
      string,

    now:
      number,
  ): void {
    const current =
      this.get(
        providerName,
      );

    this.health.set(
      current.providerName,
      {
        ...current,

        consecutiveFailures:
          0,

        lastSuccessAt:
          now,

        unhealthyUntil:
          undefined,
      },
    );
  }

  recordFailure(
    providerName:
      string,

    now:
      number,

    cooldownMilliseconds:
      number,
  ): void {
    const current =
      this.get(
        providerName,
      );

    const consecutiveFailures =
      current.consecutiveFailures +
      1;

    this.health.set(
      current.providerName,
      {
        ...current,

        consecutiveFailures,

        lastFailureAt:
          now,

        unhealthyUntil:
          now +
          cooldownMilliseconds,
      },
    );
  }

  isHealthy(
    providerName:
      string,

    now:
      number,
  ): boolean {
    const current =
      this.get(
        providerName,
      );

    return (
      current.unhealthyUntil ===
        undefined ||
      current.unhealthyUntil <=
        now
    );
  }

  list():
    readonly PlacesProviderHealth[] {
    return Array.from(
      this.health.values(),
    );
  }
}
