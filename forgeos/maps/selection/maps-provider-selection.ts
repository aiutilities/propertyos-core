import {
  MAP_PROVIDER_CAPABILITIES,
  MapProviderCapability,
} from '../contracts';

import {
  MapsProviderRegistry,
} from '../registry';

import {
  MapsProviderSelectionInvalidError,
  MapsProviderSelectionNotConfiguredError,
} from './maps-provider-selection.error';

import {
  MapsProviderSelectionConfiguration,
  MapsProviderSelectionResult,
} from './maps-provider-selection.types';

export class MapsProviderSelection {
  private readonly providersByCapability =
    new Map<
      MapProviderCapability,
      readonly string[]
    >();

  constructor(
    configuration:
      MapsProviderSelectionConfiguration,

    registry:
      MapsProviderRegistry,
  ) {
    const errors:
      string[] = [];

    const seenCapabilities =
      new Set<
        MapProviderCapability
      >();

    for (
      const rule of
        configuration.rules
    ) {
      if (
        !MAP_PROVIDER_CAPABILITIES
          .includes(
            rule.capability,
          )
      ) {
        errors.push(
          `Unsupported Maps capability: ${rule.capability}`,
        );

        continue;
      }

      if (
        seenCapabilities.has(
          rule.capability,
        )
      ) {
        errors.push(
          `Duplicate Maps provider selection rule for ${rule.capability}`,
        );

        continue;
      }

      seenCapabilities.add(
        rule.capability,
      );

      if (
        rule.providers.length ===
          0
      ) {
        errors.push(
          `Maps provider selection for ${rule.capability} must contain at least one provider`,
        );

        continue;
      }

      const duplicateProviders =
        rule.providers.filter(
          (
            providerName,
            index,
            providers,
          ) =>
            providers.indexOf(
              providerName,
            ) !== index,
        );

      if (
        duplicateProviders
          .length > 0
      ) {
        errors.push(
          `Maps provider selection for ${rule.capability} contains duplicate providers`,
        );
      }

      for (
        const providerName of
          rule.providers
      ) {
        const provider =
          registry.get(
            providerName,
          );

        if (!provider) {
          errors.push(
            `Maps provider is not registered: ${providerName}`,
          );

          continue;
        }

        if (
          !provider.capabilities
            .includes(
              rule.capability,
            )
        ) {
          errors.push(
            `Maps provider ${providerName} does not support ${rule.capability}`,
          );
        }
      }

      this.providersByCapability
        .set(
          rule.capability,
          [
            ...rule.providers,
          ],
        );
    }

    if (
      errors.length > 0
    ) {
      throw new MapsProviderSelectionInvalidError(
        errors,
      );
    }
  }

  select(
    capability:
      MapProviderCapability,
  ): MapsProviderSelectionResult {
    const providers =
      this.providersByCapability
        .get(
          capability,
        );

    if (!providers) {
      throw new MapsProviderSelectionNotConfiguredError(
        capability,
      );
    }

    return {
      capability,
      providers,
    };
  }

  has(
    capability:
      MapProviderCapability,
  ): boolean {
    return this.providersByCapability
      .has(
        capability,
      );
  }

  list():
    MapsProviderSelectionResult[] {
    return Array.from(
      this.providersByCapability
        .entries(),
    ).map(
      (
        [
          capability,
          providers,
        ],
      ) => ({
        capability,
        providers,
      }),
    );
  }
}
