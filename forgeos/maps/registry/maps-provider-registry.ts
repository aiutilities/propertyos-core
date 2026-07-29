import {
  MapsProvider,
  MapProviderCapability,
} from '../contracts';

import {
  MapsProviderCapabilityNotSupportedError,
  MapsProviderNotFoundError,
} from './maps-provider-registry.error';

export class MapsProviderRegistry {
  private readonly providers =
    new Map<
      string,
      MapsProvider
    >();

  register(
    provider:
      MapsProvider,
  ): void {
    this.providers.set(
      provider.name,
      provider,
    );
  }

  has(
    providerName:
      string,
  ): boolean {
    return this.providers.has(
      providerName,
    );
  }

  get(
    providerName:
      string,
  ): MapsProvider | undefined {
    return this.providers.get(
      providerName,
    );
  }

  require(
    providerName:
      string,
  ): MapsProvider {
    const provider =
      this.get(
        providerName,
      );

    if (!provider) {
      throw new MapsProviderNotFoundError(
        providerName,
      );
    }

    return provider;
  }

  requireCapability(
    providerName:
      string,

    capability:
      MapProviderCapability,
  ): MapsProvider {
    const provider =
      this.require(
        providerName,
      );

    if (
      !provider.capabilities
        .includes(
          capability,
        )
    ) {
      throw new MapsProviderCapabilityNotSupportedError(
        providerName,
        capability,
      );
    }

    return provider;
  }

  list():
    MapsProvider[] {
    return Array.from(
      this.providers.values(),
    );
  }

  unregister(
    providerName:
      string,
  ): boolean {
    return this.providers.delete(
      providerName,
    );
  }

  clear(): void {
    this.providers.clear();
  }
}
