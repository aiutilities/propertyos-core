export class PlacesProviderAlreadyRegisteredError
  extends Error
{
  readonly code =
    'PLACES_PROVIDER_ALREADY_REGISTERED';

  constructor(
    readonly providerName:
      string,
  ) {
    super(
      `Places provider is already registered: ${providerName}`,
    );

    this.name =
      'PlacesProviderAlreadyRegisteredError';
  }
}

export class PlacesProviderNotFoundError
  extends Error
{
  readonly code =
    'PLACES_PROVIDER_NOT_FOUND';

  constructor(
    readonly providerName:
      string,
  ) {
    super(
      `Places provider is not registered: ${providerName}`,
    );

    this.name =
      'PlacesProviderNotFoundError';
  }
}
