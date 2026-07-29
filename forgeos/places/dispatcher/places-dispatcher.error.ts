export class PlacesProviderOperationUnavailableError
  extends Error
{
  readonly code =
    'PLACES_PROVIDER_OPERATION_UNAVAILABLE';

  constructor(
    readonly providerName:
      string,

    readonly operation:
      string,
  ) {
    super(
      `Places provider ${providerName} does not implement ${operation}`,
    );

    this.name =
      'PlacesProviderOperationUnavailableError';
  }
}
