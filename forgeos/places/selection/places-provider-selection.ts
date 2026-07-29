import {
  PlacesProviderCapability,
} from '../contracts';

import {
  PlacesProviderRegistry,
} from '../registry';

import {
  PlacesProviderSelectionError,
} from './places-provider-selection.error';

import {
  PlacesProviderSelectionConfiguration,
  PlacesProviderSelectionResult,
} from './places-provider-selection.types';

export class PlacesProviderSelection {
  private readonly rules =
    new Map<
      PlacesProviderCapability,
      readonly string[]
    >();

  constructor(
    configuration:
      PlacesProviderSelectionConfiguration,

    private readonly registry:
      PlacesProviderRegistry,
  ) {
    for (
      const rule of
        configuration.rules
    ) {
      if (
        this.rules.has(
          rule.capability,
        )
      ) {
        throw new PlacesProviderSelectionError(
          rule.capability,
          [
            'duplicate capability rule',
          ],
        );
      }

      const providers =
        rule.providers
          .map(
            (providerName) =>
              providerName
                .trim()
                .toLowerCase(),
          )
          .filter(Boolean);

      if (
        providers.length === 0
      ) {
        throw new PlacesProviderSelectionError(
          rule.capability,
          [
            'provider list must not be empty',
          ],
        );
      }

      this.rules.set(
        rule.capability,
        providers,
      );
    }
  }

  select(
    capability:
      PlacesProviderCapability,
  ): PlacesProviderSelectionResult {
    const configured =
      this.rules.get(
        capability,
      );

    if (!configured) {
      throw new PlacesProviderSelectionError(
        capability,
        [
          'selection rule is not configured',
        ],
      );
    }

    const available =
      configured.filter(
        (providerName) => {
          const provider =
            this.registry.get(
              providerName,
            );

          return Boolean(
            provider &&
            provider.capabilities
              .includes(
                capability,
              ),
          );
        },
      );

    if (
      available.length === 0
    ) {
      throw new PlacesProviderSelectionError(
        capability,
        [
          'none of the configured providers are registered with the required capability',
        ],
      );
    }

    return {
      capability,
      providers:
        available,
    };
  }

  list():
    PlacesProviderSelectionResult[] {
    return Array.from(
      this.rules.keys(),
    ).map(
      (capability) =>
        this.select(
          capability,
        ),
    );
  }
}
