import {
  PlacesProviderCapability,
} from '../contracts';

export class PlacesProviderSelectionError
  extends Error
{
  readonly code =
    'PLACES_PROVIDER_SELECTION_FAILED';

  constructor(
    readonly capability:
      PlacesProviderCapability,

    readonly details:
      readonly string[],
  ) {
    super(
      `No usable Places provider selection exists for ${capability}: ${details.join('; ')}`,
    );

    this.name =
      'PlacesProviderSelectionError';
  }
}
