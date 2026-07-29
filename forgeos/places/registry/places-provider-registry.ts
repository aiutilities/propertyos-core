import {
  PlacesProvider,
  PlacesProviderCapability,
} from '../contracts';

import {
  PlacesProviderAlreadyRegisteredError,
  PlacesProviderNotFoundError,
} from './places-provider-registry.error';

export class PlacesProviderRegistry {
  private readonly providers =
    new Map<
      string,
      PlacesProvider
    >();

  register(
    provider:
      PlacesProvider,
  ): void {
    const name =
      provider.name
        .trim()
        .toLowerCase();

    if (!name) {
      throw new Error(
        'PLACES_PROVIDER_NAME_REQUIRED',
      );
    }

    if (
      this.providers.has(
        name,
      )
    ) {
      throw new PlacesProviderAlreadyRegisteredError(
        name,
      );
    }

    this.providers.set(
      name,
      provider,
    );
  }

  get(
    providerName:
      string,
  ): PlacesProvider | undefined {
    return this.providers.get(
      providerName
        .trim()
        .toLowerCase(),
    );
  }

  require(
    providerName:
      string,
  ): PlacesProvider {
    const provider =
      this.get(
        providerName,
      );

    if (!provider) {
      throw new PlacesProviderNotFoundError(
        providerName,
      );
    }

    return provider;
  }

  list():
    PlacesProvider[] {
    return Array.from(
      this.providers.values(),
    );
  }

  listByCapability(
    capability:
      PlacesProviderCapability,
  ): PlacesProvider[] {
    return this.list()
      .filter(
        (provider) =>
          provider.capabilities
            .includes(
              capability,
            ),
      );
  }
}
