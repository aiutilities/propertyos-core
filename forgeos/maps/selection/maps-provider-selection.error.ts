import {
  MapProviderCapability,
} from '../contracts';

export class MapsProviderSelectionNotConfiguredError
  extends Error
{
  readonly code =
    'MAPS_PROVIDER_SELECTION_NOT_CONFIGURED';

  constructor(
    readonly capability:
      MapProviderCapability,
  ) {
    super(
      `Maps provider selection is not configured for ${capability}`,
    );

    this.name =
      'MapsProviderSelectionNotConfiguredError';
  }
}

export class MapsProviderSelectionInvalidError
  extends Error
{
  readonly code =
    'MAPS_PROVIDER_SELECTION_INVALID';

  constructor(
    readonly errors:
      readonly string[],
  ) {
    super(
      `Maps provider selection configuration is invalid: ${errors.join('; ')}`,
    );

    this.name =
      'MapsProviderSelectionInvalidError';
  }
}
