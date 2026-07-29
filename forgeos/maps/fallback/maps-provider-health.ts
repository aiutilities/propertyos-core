export interface MapsProviderHealthSnapshot {
  providerName:
    string;

  healthy:
    boolean;

  consecutiveFailures:
    number;

  lastFailureAt?:
    string;

  lastSuccessAt?:
    string;

  lastErrorCode?:
    string;
}

export interface MapsProviderHealthStore {
  get(
    providerName:
      string,
  ): MapsProviderHealthSnapshot;

  recordSuccess(
    providerName:
      string,

    occurredAt:
      string,
  ): void;

  recordFailure(
    providerName:
      string,

    errorCode:
      string,

    occurredAt:
      string,
  ): void;
}

export class InMemoryMapsProviderHealthStore
  implements MapsProviderHealthStore
{
  private readonly snapshots =
    new Map<
      string,
      MapsProviderHealthSnapshot
    >();

  get(
    providerName:
      string,
  ): MapsProviderHealthSnapshot {
    return (
      this.snapshots.get(
        providerName,
      ) ?? {
        providerName,
        healthy:
          true,
        consecutiveFailures:
          0,
      }
    );
  }

  recordSuccess(
    providerName:
      string,

    occurredAt:
      string,
  ): void {
    this.snapshots.set(
      providerName,
      {
        providerName,
        healthy:
          true,
        consecutiveFailures:
          0,
        lastSuccessAt:
          occurredAt,
      },
    );
  }

  recordFailure(
    providerName:
      string,

    errorCode:
      string,

    occurredAt:
      string,
  ): void {
    const existing =
      this.get(
        providerName,
      );

    const consecutiveFailures =
      existing
        .consecutiveFailures +
      1;

    this.snapshots.set(
      providerName,
      {
        ...existing,

        providerName,

        healthy:
          false,

        consecutiveFailures,

        lastFailureAt:
          occurredAt,

        lastErrorCode:
          errorCode,
      },
    );
  }
}
